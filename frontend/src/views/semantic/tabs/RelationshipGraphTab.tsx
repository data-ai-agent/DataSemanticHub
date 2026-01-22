import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Key, GripHorizontal, ZoomIn, ZoomOut, Maximize, Share2, Layers, Info } from 'lucide-react';
import { TableSemanticProfile, FieldSemanticProfile } from '../../../types/semantic';

/* --------------------------------------------------------------------------------
 * Types & Interfaces for the Graph
 * -------------------------------------------------------------------------------- */

interface GraphNode {
    id: string;
    label: string; // Business Object Name
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'PatternA' | 'PatternB' | 'PatternC'; // A/B: Standard, C: Split
    attributes: GraphAttribute[];
}

interface GraphAttribute {
    id: string; // Field ID or Name
    name: string; // Field Name
    label: string; // Business Item Name (e.g. "Order Amount")
    isKey: boolean; // Is Primary Key or Business Key
    isForeignKey: boolean;
    dataType: string;
}

interface GraphEdge {
    id: string;
    source: string; // Node ID
    target: string; // Node ID
    label?: string; // Relationship Name
    type: 'suggested' | 'confirmed';
}

interface RelationshipGraphTabProps {
    semanticProfile: TableSemanticProfile;
}

/* --------------------------------------------------------------------------------
 * Helper: Data Transformation (ScanResults -> Graph Model)
 * -------------------------------------------------------------------------------- */

const transformToGraph = (profile: TableSemanticProfile): { nodes: GraphNode[]; edges: GraphEdge[] } => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // --- 1. Identify Internal Business Objects (Nodes) ---
    // Pattern A/B: One Table = One Object (Default)
    // Pattern C: One Table = Multiple Objects (Split by BO tag)

    const objectGroups: Record<string, FieldSemanticProfile[]> = {};
    const defaultObjectName = profile.businessName || profile.tableName || '未命名对象';

    // Group fields by Business Object
    if (!profile.fields || profile.fields.length === 0) {
        objectGroups[defaultObjectName] = [];
    } else {
        profile.fields.forEach((field: FieldSemanticProfile) => {
            // Pattern C Logic: Check tags for "BO:Name" to identify if this field belongs to a specific split object
            const boTag = field.tags?.find((t: string) => t.startsWith('BO:'));
            const objectName = boTag ? boTag.replace('BO:', '') : defaultObjectName;

            if (!objectGroups[objectName]) {
                objectGroups[objectName] = [];
            }
            objectGroups[objectName].push(field);
        });
    }

    // --- 2. Create Layout for Internal Nodes ---
    let xOffset = 50;
    const yOffset = 100; // Move down to leave space for potential upstream or just better centering
    const NODE_WIDTH = 260;
    const GAP = 80;

    const internalNodeIds: string[] = [];

    Object.entries(objectGroups).forEach(([objName, fields]) => {
        // Calculate dynamic height
        const headerHeight = 44;
        const itemHeight = 28;
        const padding = 16;
        const contentHeight = fields.length * itemHeight;
        const height = headerHeight + padding + contentHeight + 10; // +10 for buffer

        const isSplit = Object.keys(objectGroups).length > 1;

        const nodeId = `internal-${objName}`;
        internalNodeIds.push(nodeId);

        nodes.push({
            id: nodeId,
            label: objName,
            x: xOffset,
            y: yOffset,
            width: NODE_WIDTH,
            height: height,
            type: isSplit ? 'PatternC' : 'PatternA',
            attributes: fields.map(f => ({
                id: f.fieldName,
                name: f.fieldName,
                label: f.aiSuggestion || f.fieldName,
                isKey: f.role === 'Identifier' || f.fieldName === 'id',
                isForeignKey: f.role === 'ForeignKey' || f.fieldName?.endsWith('_id'),
                dataType: f.dataType || 'string'
            }))
        });

        xOffset += NODE_WIDTH + GAP;
    });

    // --- 3. Process External Relationships (Edges & External Nodes) ---
    // Create nodes for referenced tables/objects if they exist in relationships

    // We position external nodes to the right of the last internal node for now
    let extXOffset = xOffset + 100;

    if (profile.relationships && profile.relationships.length > 0) {
        profile.relationships.forEach((rel: any, index: number) => {
            const targetName = rel.targetTable;
            const targetId = `external-${targetName}`;

            // Avoid duplicate nodes if multiple relationships point to same target
            if (!nodes.find(n => n.id === targetId)) {
                nodes.push({
                    id: targetId,
                    label: targetName, // In a real app, we'd look up the Business Name
                    x: extXOffset,
                    y: yOffset + (index * 60) - 40, // Stagger slightly
                    width: 200,
                    height: 100, // Compact external node
                    type: 'PatternB', // External usually implies a relation
                    attributes: [] // We typically don't show full attributes for external nodes in this view context
                });

                // Add Edge
                // Connect from the main object (or the specific split object if we knew which one)
                // For now, connect from the FIRST internal object usually, or heuristic matching
                const sourceId = internalNodeIds[0];

                edges.push({
                    id: `rel-${index}`,
                    source: sourceId,
                    target: targetId,
                    label: rel.type || '关联',
                    type: 'suggested'
                });

                extXOffset += 20; // stagger x slightly too
            }
        });
    }

    // --- 4. Pattern C Internal Edges ---
    // If we split the table into multiple objects (Pattern C), visualization usually implies they are related.
    // We add simple dashed links between them to show they originate from the same physical constant.
    if (internalNodeIds.length > 1) {
        for (let i = 0; i < internalNodeIds.length - 1; i++) {
            edges.push({
                id: `internal-link-${i}`,
                source: internalNodeIds[i],
                target: internalNodeIds[i + 1],
                label: '来源同表',
                type: 'suggested'
            });
        }
    }

    return { nodes, edges };
};

/* --------------------------------------------------------------------------------
 * Component: RelationshipGraphTab
 * -------------------------------------------------------------------------------- */

export const RelationshipGraphTab = ({ semanticProfile }: RelationshipGraphTabProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Memoized Graph Data
    const { nodes, edges } = useMemo(() => transformToGraph(semanticProfile), [semanticProfile]);

    // Handlers
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(s => Math.min(Math.max(0.5, s * delta), 2));
        } else {
            // Pan
            setPosition(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { // Left click
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    return (
        <div className="h-[600px] flex flex-col relative border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white p-1 rounded-lg shadow-md border border-slate-100">
                <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 hover:bg-slate-50 text-slate-600 rounded">
                    <ZoomIn size={18} />
                </button>
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 hover:bg-slate-50 text-slate-600 rounded">
                    <ZoomOut size={18} />
                </button>
                <button onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} className="p-2 hover:bg-slate-50 text-slate-600 rounded">
                    <Maximize size={18} />
                </button>
            </div>

            {/* Legend */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-200 text-xs">
                <div className="font-semibold text-slate-700 mb-2">图例说明</div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                        <span>业务对象 (Business Object)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-px bg-slate-400 border-t border-dashed"></div>
                        <span>建议关联 (Suggested)</span>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing relative"
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                    className="absolute top-0 left-0 w-full h-full"
                >
                    <svg className="overflow-visible w-full h-full pointer-events-none absolute top-0 left-0 z-0">
                        {edges.map(edge => {
                            const sourceNode = nodes.find(n => n.id === edge.source);
                            const targetNode = nodes.find(n => n.id === edge.target);
                            if (!sourceNode || !targetNode) return null;

                            const sx = sourceNode.x + sourceNode.width; // Right center
                            const sy = sourceNode.y + sourceNode.height / 2;
                            const tx = targetNode.x; // Left center
                            const ty = targetNode.y + targetNode.height / 2;

                            // Bezier Curve
                            const controlPointOffset = Math.abs(tx - sx) * 0.5;
                            const d = `M ${sx} ${sy} C ${sx + controlPointOffset} ${sy}, ${tx - controlPointOffset} ${ty}, ${tx} ${ty}`;

                            return (
                                <g key={edge.id}>
                                    <path
                                        d={d}
                                        fill="none"
                                        stroke="#94a3b8"
                                        strokeWidth="1.5"
                                        strokeDasharray="4 4"
                                    />
                                    <circle cx={sx} cy={sy} r="3" fill="#94a3b8" />
                                    <polygon points={`${tx},${ty} ${tx - 6},${ty - 3} ${tx - 6},${ty + 3}`} fill="#94a3b8" />
                                </g>
                            );
                        })}
                    </svg>

                    {nodes.map(node => (
                        <div
                            key={node.id}
                            style={{
                                transform: `translate(${node.x}px, ${node.y}px)`,
                                width: node.width,
                                height: node.height // Use calculated height or auto
                            }}
                            className="absolute bg-white rounded-lg shadow-lg border border-slate-200 flex flex-col z-10 hover:shadow-xl hover:border-blue-400 transition-all group"
                        >
                            {/* Header */}
                            <div className="h-10 px-3 flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 rounded-t-lg">
                                <Box size={14} className="text-blue-600" />
                                <span className="font-semibold text-sm text-slate-700 truncate" title={node.label}>{node.label}</span>
                                <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                    {node.type === 'PatternC' ? 'Split' : 'Object'}
                                </span>
                            </div>

                            {/* Attributes List */}
                            <div className="flex-1 p-2 overflow-y-auto custom-scrollbar">
                                {node.type === 'PatternB' && node.attributes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 py-2">
                                        <div className="text-[10px] uppercase tracking-wider mb-1">External</div>
                                        <div className="text-xs italic">外部关联对象</div>
                                    </div>
                                ) : node.attributes.length === 0 ? (
                                    <div className="text-center text-xs text-slate-400 py-4 italic">暂无属性</div>
                                ) : (
                                    <div className="space-y-1">
                                        {node.attributes.map(attr => (
                                            <div key={attr.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-50/50 group/item transition-colors">
                                                {attr.isKey ? (
                                                    <Key size={12} className="text-amber-500 shrink-0" />
                                                ) : attr.isForeignKey ? (
                                                    <Share2 size={12} className="text-blue-400 shrink-0" />
                                                ) : (
                                                    <div className="w-3 h-3 rounded-full bg-slate-200 shrink-0 border border-slate-300"></div>
                                                )}
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-medium text-slate-700 truncate">{attr.label}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono truncate">{attr.name}</span>
                                                </div>
                                                <span className="ml-auto text-[10px] text-slate-400 bg-slate-50 px-1 rounded border border-slate-100">
                                                    {attr.dataType}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
