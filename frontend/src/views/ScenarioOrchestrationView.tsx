// ==========================================
// Scenario Orchestration View (TD-04)
// ==========================================
// Location: tt5.tsx:3065-3438

import React, { useRef, useState } from 'react';
import {
    Layers, Plus, Search, Box, MousePointer, Move, ZoomIn, ZoomOut,
    Play, Save, Settings, MoreHorizontal, CheckCircle, RefreshCw, X, Link, Network, Maximize, Minimize
} from 'lucide-react';
import { BusinessObject } from '../types/semantic';

interface ScenarioOrchestrationViewProps {
    businessObjects: BusinessObject[];
}

interface ScenarioNode {
    id: string;
    type: 'start' | 'end' | 'action' | 'object';
    label: string;
    objectId: string | null;
    status: 'done' | 'process' | 'pending';
    x: number;
    y: number;
}

interface ScenarioEdge {
    from: string;
    to: string;
    label: string;
}

interface Scenario {
    id: string;
    name: string;
    status: 'active' | 'draft';
    description: string;
    involvedObjects: string[];
    nodes: ScenarioNode[];
    edges: ScenarioEdge[];
}

const ScenarioOrchestrationView: React.FC<ScenarioOrchestrationViewProps> = ({ businessObjects }) => {
    // Canvas State
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Node Dragging State
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

    const [activeScenarioId, setActiveScenarioId] = useState('SC_SCM_001');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simStep, setSimStep] = useState(0);
    const [simLogs, setSimLogs] = useState<string[]>([]);
    const [activeSimNodeId, setActiveSimNodeId] = useState<string | null>(null);
    const [activeSimEdgeIndex, setActiveSimEdgeIndex] = useState<number | null>(null);
    const [simSpeed, setSimSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
    const [showKnowledgeNetwork, setShowKnowledgeNetwork] = useState(true);
    const [isKnowledgeNetworkFull, setIsKnowledgeNetworkFull] = useState(false);
    const [isCanvasFull, setIsCanvasFull] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveToast, setSaveToast] = useState<'idle' | 'saving' | 'success'>('idle');
    const simTokenRef = useRef(0);
    const saveTimerRef = useRef<number | null>(null);
    const [newScenario, setNewScenario] = useState({
        name: '',
        description: '',
        involvedObjects: [] as string[]
    });

    // 模拟场景数据
    const mockScenarios: Scenario[] = [
        {
            id: 'SC_001',
            name: '出生医学证明申领流程',
            status: 'active',
            description: '新生儿出生后，由医院发起信息登记，监护人确认申领，最终系统自动签发电子证照。',
            involvedObjects: ['新生儿', '出生医学证明'],
            nodes: [
                { id: 'n1', type: 'start', label: '出生登记', objectId: 'BO_NEWBORN', status: 'done', x: 100, y: 100 },
                { id: 'n2', type: 'action', label: '监护人申领', objectId: null, status: 'done', x: 300, y: 100 },
                { id: 'n3', type: 'object', label: '生成证明', objectId: 'BO_CERT', status: 'process', x: 500, y: 100 },
                { id: 'n4', type: 'end', label: '归档完成', objectId: null, status: 'pending', x: 700, y: 100 },
            ],
            edges: [
                { from: 'n1', to: 'n2', label: '触发' },
                { from: 'n2', to: 'n3', label: '提交申请' },
                { from: 'n3', to: 'n4', label: '自动归档' },
            ]
        },
        {
            id: 'SC_002',
            name: '新生儿落户办理',
            status: 'draft',
            description: '基于出生医学证明和监护人户口簿，办理新生儿户口登记。',
            involvedObjects: ['出生医学证明'],
            nodes: [
                { id: 'n1', type: 'start', label: '获取证明', objectId: 'BO_CERT', status: 'pending', x: 100, y: 100 },
                { id: 'n2', type: 'object', label: '户籍登记', objectId: null, status: 'pending', x: 300, y: 100 }
            ],
            edges: [
                { from: 'n1', to: 'n2', label: '作为依据' }
            ]
        },
        {
            id: 'SC_003',
            name: '疫苗接种管理',
            status: 'draft',
            description: '新生儿疫苗接种计划制定和执行跟踪。',
            involvedObjects: ['新生儿'],
            nodes: [
                { id: 'n1', type: 'start', label: '制定计划', objectId: 'BO_NEWBORN', status: 'pending', x: 100, y: 100 },
                { id: 'n2', type: 'action', label: '接种提醒', objectId: null, status: 'pending', x: 300, y: 100 },
                { id: 'n3', type: 'end', label: '记录完成', objectId: null, status: 'pending', x: 500, y: 100 }
            ],
            edges: [
                { from: 'n1', to: 'n2', label: '生成' },
                { from: 'n2', to: 'n3', label: '执行' }
            ]
        },
        // 🚚 SG-DEMO: Supply Chain Traceability
        {
            id: 'SC_SCM_001',
            name: '供应链全链路追踪',
            status: 'active',
            description: '从供应商采购到入库再到物流配送的全链路数据流转场景。',
            involvedObjects: ['供应商', '采购订单', '库存', '物流运单'],
            nodes: [
                { id: 'n1', type: 'start', label: '供应商入驻', objectId: 'BO_SCM_SUPPLIER', status: 'done', x: 100, y: 150 },
                { id: 'n2', type: 'action', label: '采购下单', objectId: null, status: 'done', x: 300, y: 150 },
                { id: 'n3', type: 'object', label: '采购订单', objectId: 'BO_SCM_PO', status: 'done', x: 500, y: 150 },
                { id: 'n4', type: 'action', label: '入库作业', objectId: null, status: 'process', x: 700, y: 150 },
                { id: 'n5', type: 'object', label: '库存更新', objectId: 'BO_SCM_INVENTORY', status: 'pending', x: 900, y: 150 },
                { id: 'n6', type: 'action', label: '物流发货', objectId: null, status: 'pending', x: 1100, y: 150 },
                { id: 'n7', type: 'end', label: '物流配送', objectId: 'BO_SCM_DELIVERY', status: 'pending', x: 1300, y: 150 }
            ],
            edges: [
                { from: 'n1', to: 'n2', label: '发起采购' },
                { from: 'n2', to: 'n3', label: '生成订单' },
                { from: 'n3', to: 'n4', label: '收货入库' },
                { from: 'n4', to: 'n5', label: '更新库存' },
                { from: 'n5', to: 'n6', label: '安排发货' },
                { from: 'n6', to: 'n7', label: '生成运单' }
            ]
        }
    ];

    const [scenarios, setScenarios] = useState<Scenario[]>(mockScenarios);
    const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
    const totalSteps = activeScenario.nodes.length;
    const progress = totalSteps ? Math.round((simStep / totalSteps) * 100) : 0;
    const isScenarioActive = activeScenario.status === 'active';
    const networkWidth = 220;
    const networkHeight = 170;
    const networkCenter = { x: networkWidth / 2, y: networkHeight / 2 };
    const networkRadius = Math.min(networkWidth, networkHeight) / 2 - 24;
    const fullNetworkWidth = 900;
    const fullNetworkHeight = 560;
    const fullNetworkCenter = { x: fullNetworkWidth / 2, y: fullNetworkHeight / 2 };
    const fullNetworkRadius = Math.min(fullNetworkWidth, fullNetworkHeight) / 2 - 90;
    // Knowledge Network State
    const [knZoom, setKnZoom] = useState(1);
    const [knOffset, setKnOffset] = useState({ x: 0, y: 0 });
    const [knDraggingNode, setKnDraggingNode] = useState<string | null>(null);
    const [knHoverNode, setKnHoverNode] = useState<string | null>(null);
    const [knDragStart, setKnDragStart] = useState({ x: 0, y: 0 });
    const [isDraggingKnCanvas, setIsDraggingKnCanvas] = useState(false);
    const [knNodePositions, setKnNodePositions] = useState<Record<string, { x: number; y: number }>>({});

    const networkNodes = activeScenario.nodes.reduce<{ id: string; label: string }[]>((acc, node) => {
        if (!node.objectId) return acc;
        if (acc.some(item => item.id === node.objectId)) return acc;
        const matchedBO = businessObjects.find(bo => bo.id === node.objectId);
        acc.push({
            id: node.objectId,
            label: matchedBO ? matchedBO.name : node.label
        });
        return acc;
    }, []);
    const scenarioObjectIds = new Set(networkNodes.map(node => node.id));

    // Static positions for preview
    const networkNodePositions = networkNodes.reduce<Record<string, { x: number; y: number }>>((acc, node, index) => {
        const angle = (2 * Math.PI * index) / Math.max(networkNodes.length, 1);
        acc[node.id] = {
            x: networkCenter.x + Math.cos(angle) * networkRadius,
            y: networkCenter.y + Math.sin(angle) * networkRadius
        };
        return acc;
    }, {});

    // Initialize/Update KN positions when nodes change
    React.useEffect(() => {
        const center = { x: fullNetworkWidth / 2, y: fullNetworkHeight / 2 };
        const radius = Math.min(fullNetworkWidth, fullNetworkHeight) / 2 - 90;

        setKnNodePositions(prev => {
            const newPositions = { ...prev };
            // Simple circular layout for now, preserving existing if key matches?
            // Actually, for a scenario switch, we probably want a reset or a smooth transition. 
            // Let's reset for simplicity on scenario change compatibility, but keep if id exists.

            networkNodes.forEach((node, index) => {
                if (!newPositions[node.id]) {
                    const angle = (2 * Math.PI * index) / Math.max(networkNodes.length, 1);
                    newPositions[node.id] = {
                        x: center.x + Math.cos(angle) * radius,
                        y: center.y + Math.sin(angle) * radius
                    };
                }
            });
            return newPositions;
        });
    }, [activeScenarioId, networkNodes.length]); // Dependency on length/ID change

    const scenarioEdges = activeScenario.edges.reduce<{ from: string; to: string; label: string }[]>((acc, edge) => {
        const fromNode = activeScenario.nodes.find(node => node.id === edge.from);
        const toNode = activeScenario.nodes.find(node => node.id === edge.to);
        if (!fromNode?.objectId || !toNode?.objectId || fromNode.objectId === toNode.objectId) return acc;
        const key = `${fromNode.objectId}->${toNode.objectId}`;
        if (acc.some(item => `${item.from}->${item.to}` === key)) return acc;
        acc.push({ from: fromNode.objectId, to: toNode.objectId, label: edge.label });
        return acc;
    }, []);

    const fieldEdgeKeys = new Set<string>();
    const fieldEdges = networkNodes.reduce<{ from: string; to: string; label: string }[]>((acc, node, index) => {
        const sourceBO = businessObjects.find(bo => bo.id === node.id);
        const sourceFields = (sourceBO?.fields || []).map((field: any) => field?.name).filter(Boolean);
        for (let j = index + 1; j < networkNodes.length; j += 1) {
            const targetNode = networkNodes[j];
            const targetBO = businessObjects.find(bo => bo.id === targetNode.id);
            const targetFields = (targetBO?.fields || []).map((field: any) => field?.name).filter(Boolean);
            if (sourceFields.length === 0 || targetFields.length === 0) continue;
            const commonFields = sourceFields.filter(field => targetFields.includes(field));
            if (commonFields.length === 0) continue;
            const key = `${node.id}->${targetNode.id}`;
            if (fieldEdgeKeys.has(key)) continue;
            fieldEdgeKeys.add(key);
            acc.push({ from: node.id, to: targetNode.id, label: '字段关联' });
        }
        return acc;
    }, []);
    const networkEdges = [...scenarioEdges, ...fieldEdges];

    // Knowledge Network Event Handlers
    const handleKnMouseDown = (e: React.MouseEvent, nodeId?: string) => {
        e.stopPropagation();
        if (nodeId) {
            setKnDraggingNode(nodeId);
        } else {
            setIsDraggingKnCanvas(true);
            setKnDragStart({ x: e.clientX - knOffset.x, y: e.clientY - knOffset.y });
        }
    };

    const handleKnMouseMove = (e: React.MouseEvent) => {
        if (isDraggingKnCanvas) {
            setKnOffset({
                x: e.clientX - knDragStart.x,
                y: e.clientY - knDragStart.y
            });
        } else if (knDraggingNode) {
            const movementX = e.movementX / knZoom;
            const movementY = e.movementY / knZoom;
            setKnNodePositions(prev => ({
                ...prev,
                [knDraggingNode]: {
                    x: (prev[knDraggingNode]?.x || 0) + movementX,
                    y: (prev[knDraggingNode]?.y || 0) + movementY
                }
            }));
        }
    };

    const handleKnMouseUp = () => {
        setIsDraggingKnCanvas(false);
        setKnDraggingNode(null);
    };

    const handleKnWheel = (e: React.WheelEvent) => {
        // e.stopPropagation(); // Optional: stop page scroll if needed
        const delta = -e.deltaY * 0.001;
        setKnZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3));
    };

    const crossScenarioObjectIds = scenarios.reduce<Set<string>>((acc, scenario) => {
        if (scenario.id === activeScenarioId || scenario.status !== 'active') return acc;
        scenario.nodes.forEach(node => {
            if (node.objectId && scenarioObjectIds.has(node.objectId)) {
                acc.add(node.objectId);
            }
        });
        return acc;
    }, new Set<string>());

    // Canvas Event Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        // If clicking on a node (handled by node onMouseDown), ignore canvas drag
        // But we need to check if we are clicking canvas or node
        // Actually, we can put onMouseDown on the container. 
        // If target is node, setDraggedNodeId. Else set setIsDraggingCanvas.

        // However, to keep it clean, let's assume if draggedNodeId is null, we are panning.
        if (draggedNodeId) return;

        setIsDraggingCanvas(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDraggingCanvas) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        } else if (draggedNodeId) {
            // Calculate new position relative to canvas origin (taking zoom into account)
            // This is tricky. Delta movement needs to be divided by zoom.
            // Simplified approach: Update node position directly.

            // We need the movement delta
            const movementX = e.movementX / zoom;
            const movementY = e.movementY / zoom;

            const updatedScenarios = scenarios.map(sc => {
                if (sc.id === activeScenarioId) {
                    return {
                        ...sc,
                        nodes: sc.nodes.map(n => {
                            if (n.id === draggedNodeId) {
                                return { ...n, x: n.x + movementX, y: n.y + movementY };
                            }
                            return n;
                        })
                    };
                }
                return sc;
            });
            setScenarios(updatedScenarios);
        }
    };

    const handleMouseUp = () => {
        setIsDraggingCanvas(false);
        setDraggedNodeId(null);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
    const handleResetZoom = () => { setZoom(1); setOffset({ x: 0, y: 0 }); };


    const handleSaveScenario = () => {
        if (!newScenario.name) return;
        const scenarioData: Scenario = {
            id: `SC_${Date.now()}`,
            ...newScenario,
            status: 'draft',
            nodes: [
                { id: 'n1', type: 'start', label: '开始', objectId: null, status: 'pending', x: 100, y: 100 }
            ],
            edges: []
        };
        setScenarios([...scenarios, scenarioData]);
        setIsModalOpen(false);
        setNewScenario({ name: '', description: '', involvedObjects: [] });
    };

    const handleSaveCurrentScenario = () => {
        if (isSaving) return;
        setIsSaving(true);
        setSaveToast('saving');
        if (saveTimerRef.current) {
            window.clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = window.setTimeout(() => {
            setIsSaving(false);
            setSaveToast('success');
            saveTimerRef.current = window.setTimeout(() => {
                setSaveToast('idle');
            }, 1600);
        }, 900);
    };

    const updateScenarioById = (scenarioId: string, updater: (scenario: Scenario) => Scenario) => {
        setScenarios(prev =>
            prev.map(sc => (sc.id === scenarioId ? updater(sc) : sc))
        );
    };

    const stopSimulation = (scenarioId: string) => {
        simTokenRef.current += 1;
        setIsSimulating(false);
        setActiveSimNodeId(null);
        setActiveSimEdgeIndex(null);
        setSimStep(0);
        setSimLogs(prev => [...prev, '模拟运行已停止']);
        updateScenarioById(scenarioId, sc => ({
            ...sc,
            nodes: sc.nodes.map(node => ({ ...node, status: 'pending' }))
        }));
    };

    const runSimulation = async () => {
        if (isSimulating) return;
        const scenarioId = activeScenarioId;
        const scenarioSnapshot = activeScenario;
        const nodesOrder = scenarioSnapshot.nodes.map(node => node.id);
        const nodeLabelMap = new Map(scenarioSnapshot.nodes.map(node => [node.id, node.label]));
        const orderIndexMap = new Map(nodesOrder.map((id, index) => [id, index]));

        const token = simTokenRef.current + 1;
        simTokenRef.current = token;
        setIsSimulating(true);
        const speedConfig = {
            slow: { step: 1400, settle: 500, label: '慢速' },
            normal: { step: 900, settle: 300, label: '正常' },
            fast: { step: 500, settle: 200, label: '快速' }
        };
        const speed = speedConfig[simSpeed];
        setSimLogs([`开始模拟：${scenarioSnapshot.name}（${speed.label}）`]);
        setSimStep(0);
        setActiveSimNodeId(null);
        setActiveSimEdgeIndex(null);

        updateScenarioById(scenarioId, sc => ({
            ...sc,
            nodes: sc.nodes.map(node => ({ ...node, status: 'pending' }))
        }));

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < nodesOrder.length; i += 1) {
            if (simTokenRef.current !== token) return;
            const nodeId = nodesOrder[i];
            const nodeLabel = nodeLabelMap.get(nodeId) || nodeId;

            updateScenarioById(scenarioId, sc => ({
                ...sc,
                nodes: sc.nodes.map(node => {
                    const nodeIndex = orderIndexMap.get(node.id) ?? -1;
                    if (node.id === nodeId) {
                        return { ...node, status: 'process' };
                    }
                    if (nodeIndex > -1 && nodeIndex < i) {
                        return { ...node, status: 'done' };
                    }
                    return { ...node, status: 'pending' };
                })
            }));
            setActiveSimNodeId(nodeId);
            setActiveSimEdgeIndex(i > 0 ? i - 1 : null);
            setSimStep(i + 1);
            setSimLogs(prev => [...prev, `执行节点 ${i + 1}/${nodesOrder.length}：${nodeLabel}`]);

            await delay(speed.step);

            updateScenarioById(scenarioId, sc => ({
                ...sc,
                nodes: sc.nodes.map(node => (node.id === nodeId ? { ...node, status: 'done' } : node))
            }));
            setSimLogs(prev => [...prev, `${nodeLabel} 完成`]);
            await delay(speed.settle);
        }

        if (simTokenRef.current !== token) return;
        setActiveSimNodeId(null);
        setActiveSimEdgeIndex(null);
        setIsSimulating(false);
        setSimLogs(prev => [...prev, '模拟运行完成']);
    };

    const renderCanvasPanel = (isFull: boolean) => (
        <div
            className={`${isFull ? 'w-full h-full' : 'flex-1'} bg-gradient-to-br from-slate-50 via-white to-slate-100 border border-slate-200 rounded-xl shadow-inner flex flex-col overflow-hidden relative`}
        >
            {/* 工具栏 */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                <button
                    className={`p-2 rounded ${!draggedNodeId && !isDraggingCanvas ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}
                    title="选择模式"
                >
                    <MousePointer size={18} />
                </button>
                <button
                    className={`p-2 rounded ${isDraggingCanvas ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}
                    title="移动画布 (按住拖拽)"
                >
                    <Move size={18} />
                </button>
                <div className="h-px bg-slate-200 my-1"></div>
                <button onClick={handleZoomIn} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded" title="放大">
                    <ZoomIn size={18} />
                </button>
                <button onClick={handleZoomOut} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded" title="缩小">
                    <ZoomOut size={18} />
                </button>
                <button onClick={handleResetZoom} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded" title="重置视图">
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* 操作按钮 */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {isSimulating ? (
                    <button
                        onClick={() => stopSimulation(activeScenarioId)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 text-sm rounded-lg shadow-sm hover:bg-rose-50"
                    >
                        <X size={14} /> 停止运行
                    </button>
                ) : (
                    <button
                        onClick={runSimulation}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg shadow-sm hover:bg-slate-50"
                    >
                        <Play size={14} className="text-emerald-500" /> 模拟运行
                    </button>
                )}
                <button
                    onClick={handleSaveCurrentScenario}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg shadow-sm ${isSaving
                        ? 'bg-purple-200 text-purple-700 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200'
                        }`}
                >
                    {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {isSaving ? '保存中...' : '保存场景'}
                </button>
                <button
                    onClick={() => setIsCanvasFull(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg shadow-sm hover:bg-slate-50"
                >
                    {isFull ? <Minimize size={14} /> : <Maximize size={14} />}
                    {isFull ? '退出全屏' : '全屏'}
                </button>
            </div>

            {/* 画布内容 */}
            <div
                className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* 变换容器 (Zoom & Pan) */}
                <div
                    className="absolute inset-0 transition-transform duration-75 ease-linear origin-top-left"
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        width: '10000px',
                        height: '10000px'
                    }}
                >
                    {/* Grid Background */}
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    />

                    {/* Nodes */}
                    {activeScenario.nodes.map((node) => {
                        const matchedBO = businessObjects.find((bo) => bo.id === node.objectId);
                        const isActiveNode = node.id === activeSimNodeId;

                        return (
                            <React.Fragment key={node.id}>
                                <div
                                    className={`absolute w-48 bg-white rounded-xl shadow-lg border-2 cursor-move hover:shadow-xl hover:z-50 ${isActiveNode ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-50 animate-pulse' : ''} ${node.type === 'start' ? 'border-blue-400' :
                                        node.type === 'end' ? 'border-slate-400' :
                                            node.type === 'object' ? 'border-purple-400' : 'border-orange-400'
                                        }`}
                                    style={{ left: node.x, top: node.y }}
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setDraggedNodeId(node.id);
                                    }}
                                >
                                    <div className={`px-4 py-2 rounded-t-lg border-b text-xs font-bold uppercase tracking-wider flex justify-between items-center ${node.type === 'start' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                        node.type === 'end' ? 'bg-slate-50 border-slate-100 text-slate-600' :
                                            node.type === 'object' ? 'bg-purple-50 border-purple-100 text-purple-600' : 'bg-orange-50 border-orange-100 text-orange-600'
                                        }`}>
                                        <span>{node.type}</span>
                                        {node.status === 'done' && <CheckCircle size={14} className="text-emerald-500" />}
                                        {node.status === 'process' && <RefreshCw size={14} className="text-blue-500 animate-spin-slow" />}
                                    </div>

                                    <div className="p-4">
                                        <div className="font-bold text-slate-800 mb-1">{node.label}</div>
                                        {matchedBO ? (
                                            <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded w-fit mb-2">
                                                <Box size={12} /> {matchedBO.name}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 italic mb-2">无关联对象</div>
                                        )}
                                    </div>

                                    <div className="px-4 py-2 border-t border-slate-100 flex justify-end gap-2">
                                        <Settings size={14} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                                        <MoreHorizontal size={14} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}

                    {/* SVG Edges Layer */}
                    <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
                        <defs>
                            <marker id="arrowhead-default" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                            </marker>
                            <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
                            </marker>
                            <marker id="arrowhead-done" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                            </marker>
                        </defs>
                        {activeScenario.edges.map((edge, idx) => {
                            const fromNode = activeScenario.nodes.find(n => n.id === edge.from);
                            const toNode = activeScenario.nodes.find(n => n.id === edge.to);
                            if (!fromNode || !toNode) return null;
                            const isActiveEdge = idx === activeSimEdgeIndex;
                            const isCompletedEdge = activeSimEdgeIndex !== null && idx < activeSimEdgeIndex;
                            const strokeColor = isActiveEdge ? '#22c55e' : isCompletedEdge ? '#10b981' : '#94a3b8';
                            const marker = isActiveEdge ? 'url(#arrowhead-active)' : isCompletedEdge ? 'url(#arrowhead-done)' : 'url(#arrowhead-default)';

                            const sourceX = fromNode.x + 192;
                            const sourceY = fromNode.y + 60;
                            const targetX = toNode.x;
                            const targetY = toNode.y + 60;

                            const curvature = 0.5;
                            const deltaX = Math.abs(targetX - sourceX) * curvature;
                            const controlDist = Math.max(deltaX, 80);

                            const cp1X = sourceX + controlDist;
                            const cp1Y = sourceY;
                            const cp2X = targetX - controlDist;
                            const cp2Y = targetY;

                            const pathData = `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;

                            const t = 0.5;
                            const labelX = Math.pow(1 - t, 3) * sourceX + 3 * Math.pow(1 - t, 2) * t * cp1X + 3 * (1 - t) * Math.pow(t, 2) * cp2X + Math.pow(t, 3) * targetX;
                            const labelY = Math.pow(1 - t, 3) * sourceY + 3 * Math.pow(1 - t, 2) * t * cp1Y + 3 * (1 - t) * Math.pow(t, 2) * cp2Y + Math.pow(t, 3) * targetY;

                            return (
                                <g key={`${edge.from}-${edge.to}`}>
                                    <path
                                        d={pathData}
                                        stroke={strokeColor}
                                        strokeWidth={isActiveEdge ? '3' : '2'}
                                        fill="none"
                                        markerEnd={marker}
                                        strokeLinecap="round"
                                        className={`${isActiveEdge ? 'animate-pulse' : ''} transition-all duration-150`}
                                    />
                                    <foreignObject x={labelX - 20} y={labelY - 10} width="40" height="20">
                                        <div className="text-[10px] bg-white border border-slate-200 text-slate-500 rounded px-1 text-center truncate shadow-sm">
                                            {edge.label}
                                        </div>
                                    </foreignObject>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {saveToast !== 'idle' && (
                <div className="absolute bottom-4 left-4 z-10">
                    <div className={`px-3 py-2 rounded-lg text-xs shadow-sm border ${saveToast === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-purple-50 border-purple-200 text-purple-700'
                        }`}
                    >
                        {saveToast === 'success' ? '场景保存成功' : '正在保存场景...'}
                    </div>
                </div>
            )}

            {(isSimulating || simLogs.length > 0) && (
                <div className="absolute bottom-4 right-4 z-10 w-72 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">模拟运行进度</span>
                        <span className="text-[10px] text-slate-400">{simStep}/{totalSteps}</span>
                    </div>
                    <div className="px-3 pt-2 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">速度</span>
                        <div className="flex items-center gap-1">
                            {(['slow', 'normal', 'fast'] as const).map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => setSimSpeed(speed)}
                                    disabled={isSimulating}
                                    className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${simSpeed === speed
                                        ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                        } ${isSimulating ? 'cursor-not-allowed opacity-60' : ''}`}
                                >
                                    {speed === 'slow' ? '慢' : speed === 'fast' ? '快' : '中'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="px-3 py-2">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500">
                            {isSimulating ? '运行中...' : '待运行'}
                        </div>
                    </div>
                    <div className="px-3 pb-3 max-h-40 overflow-y-auto">
                        {simLogs.slice(-6).map((log, index) => (
                            <div key={`${log}-${index}`} className="text-[10px] text-slate-500 py-0.5">
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-full flex-col gap-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Layers className="text-purple-500" /> 场景编排
                    </h2>
                    <p className="text-slate-500 mt-1">可视化业务流程设计和对象关联编排</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm shadow-purple-200"
                >
                    <Plus size={16} /> 新建场景
                </button>
            </div>

            <div className="flex h-full gap-6 overflow-hidden">
                {/* 左侧：场景列表 */}
                <div className="w-64 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-slate-800">业务场景列表</h3>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            {scenarios.length} 个
                        </span>
                    </div>
                    <div className="p-3 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="搜索场景..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 transition-colors"
                            />
                        </div>
                    </div>
                    <div className="px-3 pb-3 border-b border-slate-100">
                        <button
                            onClick={() => isScenarioActive && setShowKnowledgeNetwork(prev => !prev)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${isScenarioActive
                                ? showKnowledgeNetwork
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Network size={14} />
                                知识网络
                            </span>
                            <span className="text-[10px]">
                                {isScenarioActive ? (showKnowledgeNetwork ? '已开启' : '可查看') : '仅生效'}
                            </span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {scenarios.map(sc => (
                            <div
                                key={sc.id}
                                onClick={() => setActiveScenarioId(sc.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${activeScenarioId === sc.id
                                    ? 'bg-purple-50 border-purple-200 shadow-sm'
                                    : 'hover:bg-slate-50 border-transparent hover:border-slate-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start gap-2 mb-1">
                                    <span className={`font-bold text-sm truncate ${activeScenarioId === sc.id ? 'text-purple-800' : 'text-slate-700'}`}>
                                        {sc.name}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {sc.status === 'active' && activeScenarioId === sc.id && (
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    setShowKnowledgeNetwork(true);
                                                    setIsKnowledgeNetworkFull(true);
                                                }}
                                                className="text-[10px] px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            >
                                                查看网络
                                            </button>
                                        )}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${sc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {sc.status === 'active' ? '生效' : '草稿'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 line-clamp-2 mb-2">{sc.description}</div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <Box size={10} />
                                    <span>{sc.involvedObjects.length} 个对象</span>
                                    <span className="mx-1">•</span>
                                    <span>{sc.nodes.length} 个节点</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 中间：编排画布 */}
                {renderCanvasPanel(false)}

                {/* 右侧：对象库 */}
                <div className="w-60 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <Box size={16} className="text-purple-500" />
                            业务对象库
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">拖拽对象至画布以建立关联</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {businessObjects.map((bo) => (
                            <div key={bo.id} className="p-3 bg-white border border-slate-200 rounded shadow-sm cursor-grab hover:border-purple-300 hover:shadow-md transition-all group active:cursor-grabbing">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-xs text-slate-700">{bo.name}</span>
                                    <Link size={12} className="text-slate-300 group-hover:text-purple-500" />
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">{bo.code}</div>
                                <div className="text-[10px] text-slate-500 mt-1">
                                    {bo.fields?.length || 0} 属性 • {bo.status}
                                </div>
                            </div>
                        ))}

                        <div className="p-2 border-t border-slate-100 mt-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">流程节点组件</div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-blue-400 cursor-pointer">
                                    开始
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-orange-400 cursor-pointer">
                                    动作
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-slate-400 cursor-pointer">
                                    结束
                                </div>
                                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-600 hover:border-green-400 cursor-pointer">
                                    判断
                                </div>
                            </div>
                        </div>



                        {isScenarioActive && showKnowledgeNetwork && networkNodes.length > 0 && (
                            <div className="p-3 border border-emerald-100 bg-emerald-50/40 rounded-lg mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-slate-700">知识网络</span>
                                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">生效中</span>
                                </div>
                                <svg
                                    className="w-full h-40 bg-white rounded-md border border-slate-100"
                                    viewBox={`0 0 ${networkWidth} ${networkHeight}`}
                                >
                                    <defs>
                                        <marker id="kn-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                                            <polygon points="0 0, 10 4, 0 8" fill="#10b981" />
                                        </marker>
                                        <marker id="kn-arrow-soft" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
                                            <polygon points="0 0, 10 4, 0 8" fill="#60a5fa" />
                                        </marker>
                                    </defs>
                                    <rect x="6" y="6" width={networkWidth - 12} height={networkHeight - 12} rx="10" fill="#f8fafc" stroke="#e2e8f0" />
                                    {networkEdges.map((edge, index) => {
                                        const source = networkNodePositions[edge.from];
                                        const target = networkNodePositions[edge.to];
                                        if (!source || !target) return null;
                                        const isFieldEdge = edge.label === '字段关联';
                                        const midX = (source.x + target.x) / 2;
                                        const midY = (source.y + target.y) / 2;
                                        return (
                                            <g key={`${edge.from}-${edge.to}-${index}`}>
                                                <line
                                                    x1={source.x}
                                                    y1={source.y}
                                                    x2={target.x}
                                                    y2={target.y}
                                                    stroke={isFieldEdge ? '#60a5fa' : '#10b981'}
                                                    strokeWidth="1.5"
                                                    strokeDasharray={isFieldEdge ? '5 3' : '4 2'}
                                                    markerEnd={isFieldEdge ? 'url(#kn-arrow-soft)' : 'url(#kn-arrow)'}
                                                />
                                                <rect
                                                    x={midX - 18}
                                                    y={midY - 7}
                                                    width="36"
                                                    height="14"
                                                    rx="6"
                                                    fill={isFieldEdge ? '#eff6ff' : '#ecfdf5'}
                                                    stroke={isFieldEdge ? '#dbeafe' : '#d1fae5'}
                                                />
                                                <text
                                                    x={midX}
                                                    y={midY + 4}
                                                    textAnchor="middle"
                                                    fontSize="7"
                                                    fill={isFieldEdge ? '#2563eb' : '#047857'}
                                                >
                                                    {edge.label}
                                                </text>
                                            </g>
                                        );
                                    })}
                                    {networkNodes.map(node => {
                                        const position = networkNodePositions[node.id];
                                        if (!position) return null;
                                        const isCrossScenario = crossScenarioObjectIds.has(node.id);
                                        return (
                                            <g key={node.id}>
                                                {isCrossScenario && (
                                                    <circle
                                                        cx={position.x}
                                                        cy={position.y}
                                                        r="18"
                                                        fill="none"
                                                        stroke="#38bdf8"
                                                        strokeWidth="1.2"
                                                    />
                                                )}
                                                <circle
                                                    cx={position.x}
                                                    cy={position.y}
                                                    r="16"
                                                    fill="#f8fafc"
                                                    stroke="#64748b"
                                                    strokeWidth="1.2"
                                                />
                                                {isCrossScenario && <title>跨场景联动对象</title>}
                                                <text
                                                    x={position.x}
                                                    y={position.y + 3}
                                                    textAnchor="middle"
                                                    fontSize="7"
                                                    fill="#0f172a"
                                                >
                                                    {node.label.length > 6 ? `${node.label.slice(0, 6)}…` : node.label}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </svg>
                                <div className="text-[10px] text-slate-400 mt-2">
                                    基于场景流转自动抽取对象关系
                                </div>
                                <div className="mt-2 text-[10px] text-slate-500 space-y-1">
                                    <div>对象字段级关系：字段名一致即建立关联。</div>
                                    <div>跨场景联动关系：对象在其他生效场景出现时高亮标记。</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {
                isKnowledgeNetworkFull && isScenarioActive && networkNodes.length > 0 && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
                        <div className="w-full h-full bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                                <div>
                                    <div className="text-lg font-semibold text-slate-800">知识网络</div>
                                    <div className="text-xs text-slate-500 mt-1">场景：{activeScenario.name}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 mr-4 text-xs text-slate-500 border-r border-slate-200 pr-4">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-slate-100 rounded border border-slate-300 flex items-center justify-center">
                                                <MousePointer size={8} />
                                            </div>
                                            <span>拖拽节点</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-slate-100 rounded border border-slate-300 flex items-center justify-center">
                                                <Move size={8} />
                                            </div>
                                            <span>平移画布</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-slate-100 rounded border border-slate-300 flex items-center justify-center">
                                                <Search size={8} />
                                            </div>
                                            <span>滚轮缩放</span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded">生效中</div>
                                    <button
                                        onClick={() => setIsKnowledgeNetworkFull(false)}
                                        className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden p-6 relative">
                                <div
                                    className="w-full h-full bg-slate-50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden relative"
                                    onMouseDown={(e) => handleKnMouseDown(e)}
                                    onMouseMove={handleKnMouseMove}
                                    onMouseUp={handleKnMouseUp}
                                    onMouseLeave={handleKnMouseUp}
                                    onWheel={handleKnWheel}
                                >
                                    {/* Grid Background */}
                                    <div
                                        className="absolute inset-0 opacity-20 pointer-events-none"
                                        style={{
                                            backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
                                            backgroundSize: '20px 20px',
                                            transform: `translate(${knOffset.x}px, ${knOffset.y}px) scale(${knZoom})`,
                                            transformOrigin: 'top left'
                                        }}
                                    />

                                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                                        <button
                                            onClick={() => { setKnZoom(1); setKnOffset({ x: 0, y: 0 }); }}
                                            className="p-2 bg-white border border-slate-200 rounded shadow-sm hover:bg-slate-50 text-slate-500"
                                            title="重置视图"
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                    </div>

                                    <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
                                        <svg
                                            className="w-full h-full overflow-visible"
                                            style={{ pointerEvents: 'none' }} // Let container handle base events, enable pointer-events on specific elements
                                        >
                                            <defs>
                                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="2" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                                <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#ffffff" />
                                                    <stop offset="100%" stopColor="#f1f5f9" />
                                                </linearGradient>
                                                <linearGradient id="connectedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#ecfdf5" />
                                                    <stop offset="100%" stopColor="#d1fae5" />
                                                </linearGradient>
                                                <marker id="kn-arrow-full" markerWidth="12" markerHeight="10" refX="28" refY="5" orient="auto">
                                                    <polygon points="0 0, 12 5, 0 10" fill="#10b981" />
                                                </marker>
                                                <marker id="kn-arrow-field" markerWidth="12" markerHeight="10" refX="28" refY="5" orient="auto">
                                                    <polygon points="0 0, 12 5, 0 10" fill="#60a5fa" />
                                                </marker>
                                            </defs>

                                            <g transform={`translate(${knOffset.x}, ${knOffset.y}) scale(${knZoom})`}>
                                                {networkEdges.map((edge, index) => {
                                                    const source = knNodePositions[edge.from];
                                                    const target = knNodePositions[edge.to];
                                                    if (!source || !target) return null;
                                                    const isFieldEdge = edge.label === '字段关联';

                                                    // Check for hover dimming
                                                    const isDimmed = knHoverNode && knHoverNode !== edge.from && knHoverNode !== edge.to;
                                                    const isHighlighted = knHoverNode && (knHoverNode === edge.from || knHoverNode === edge.to);

                                                    const midX = (source.x + target.x) / 2;
                                                    const midY = (source.y + target.y) / 2;
                                                    const curveOffset = isFieldEdge ? 40 : 20;

                                                    // Quadratic Bezier Curve
                                                    const pathData = `M ${source.x} ${source.y} Q ${midX + (source.y > target.y ? curveOffset : -curveOffset)} ${midY + (source.x < target.x ? -curveOffset : curveOffset)} ${target.x} ${target.y}`;

                                                    // Calculate label position (approximate at t=0.5)
                                                    // Simple midpoint logic isn't perfect for Q-curve but suffices for slight curvature.
                                                    // Better: calculate point on Q-curve.
                                                    // B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
                                                    // t=0.5 -> 0.25*P0 + 0.5*P1 + 0.25*P2
                                                    const cpX = midX + (source.y > target.y ? curveOffset : -curveOffset);
                                                    const cpY = midY + (source.x < target.x ? -curveOffset : curveOffset);
                                                    const labelX = 0.25 * source.x + 0.5 * cpX + 0.25 * target.x;
                                                    const labelY = 0.25 * source.y + 0.5 * cpY + 0.25 * target.y;

                                                    return (
                                                        <g key={`${edge.from}-${edge.to}-${index}`} className={`transition-opacity duration-300 ${isDimmed ? 'opacity-20' : 'opacity-100'}`}>
                                                            <path
                                                                d={pathData}
                                                                stroke={isFieldEdge ? '#60a5fa' : '#10b981'}
                                                                strokeWidth={isFieldEdge ? '2' : '2.5'}
                                                                strokeDasharray={isFieldEdge ? '6 4' : '0'}
                                                                fill="none"
                                                                markerEnd={isFieldEdge ? 'url(#kn-arrow-field)' : 'url(#kn-arrow-full)'}
                                                                className="transition-all duration-300"
                                                                style={{
                                                                    filter: isHighlighted ? 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.5))' : 'none'
                                                                }}
                                                            />
                                                            <g transform={`translate(${labelX}, ${labelY})`}>
                                                                <rect
                                                                    x="-34"
                                                                    y="-12"
                                                                    width="68"
                                                                    height="24"
                                                                    rx="12"
                                                                    fill={isFieldEdge ? '#eff6ff' : '#ecfdf5'}
                                                                    stroke={isFieldEdge ? '#dbeafe' : '#d1fae5'}
                                                                    className="transition-colors duration-300 shadow-sm"
                                                                />
                                                                <text
                                                                    x="0"
                                                                    y="4"
                                                                    textAnchor="middle"
                                                                    fontSize="10"
                                                                    fontWeight="500"
                                                                    fill={isFieldEdge ? '#2563eb' : '#047857'}
                                                                >
                                                                    {edge.label}
                                                                </text>
                                                            </g>
                                                        </g>
                                                    );
                                                })}

                                                {networkNodes.map(node => {
                                                    const position = knNodePositions[node.id];
                                                    if (!position) return null;
                                                    const isCrossScenario = crossScenarioObjectIds.has(node.id);
                                                    const isHovered = knHoverNode === node.id;
                                                    const isDimmed = knHoverNode && knHoverNode !== node.id &&
                                                        !networkEdges.some(e => (e.from === knHoverNode && e.to === node.id) || (e.from === node.id && e.to === knHoverNode));

                                                    return (
                                                        <g
                                                            key={node.id}
                                                            className={`transition-all duration-300 cursor-move ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}`}
                                                            style={{ pointerEvents: 'all' }}
                                                            onMouseDown={(e) => handleKnMouseDown(e, node.id)}
                                                            onMouseEnter={() => setKnHoverNode(node.id)}
                                                            onMouseLeave={() => setKnHoverNode(null)}
                                                        >
                                                            {isCrossScenario && (
                                                                <circle
                                                                    cx={position.x}
                                                                    cy={position.y}
                                                                    r="40"
                                                                    fill="none"
                                                                    stroke="#38bdf8"
                                                                    strokeWidth="2"
                                                                    strokeDasharray="4 4"
                                                                    className="animate-spin-slow-reverse opacity-60"
                                                                />
                                                            )}

                                                            {/* Node Shadow */}
                                                            <circle
                                                                cx={position.x}
                                                                cy={position.y + 4}
                                                                r="32"
                                                                fill="rgba(0,0,0,0.1)"
                                                                filter="blur(4px)"
                                                            />

                                                            {/* Main Node Body */}
                                                            <circle
                                                                cx={position.x}
                                                                cy={position.y}
                                                                r="32"
                                                                fill={isHovered ? "url(#connectedGradient)" : "url(#nodeGradient)"}
                                                                stroke={isHovered ? "#10b981" : "#64748b"}
                                                                strokeWidth={isHovered ? "2.5" : "1.5"}
                                                                className="transition-all duration-300"
                                                                filter={isHovered ? "url(#glow)" : ""}
                                                            />

                                                            {/* Icon placeholder or initial */}
                                                            <circle
                                                                cx={position.x}
                                                                cy={position.y - 8}
                                                                r="8"
                                                                fill="#f1f5f9"
                                                            />

                                                            <text
                                                                x={position.x}
                                                                y={position.y + 12}
                                                                textAnchor="middle"
                                                                fontSize="11"
                                                                fontWeight="600"
                                                                fill="#0f172a"
                                                                className="pointer-events-none select-none"
                                                            >
                                                                {node.label.length > 5 ? `${node.label.slice(0, 4)}..` : node.label}
                                                            </text>
                                                            <title>{node.label} {isCrossScenario ? '(跨场景)' : ''}</title>
                                                        </g>
                                                    );
                                                })}
                                            </g>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
                                <div className="flex gap-6">
                                    <div><span className="font-bold text-slate-700">Tips:</span> 滚轮缩放画布，拖拽空白处移动视野，按住节点可调整布局。</div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 场景流转</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400"></span> 字段关联</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 新建场景模态框 */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-lg text-slate-800">新建业务场景</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        场景名称 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newScenario.name}
                                        onChange={(e) => setNewScenario({ ...newScenario, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                        placeholder="例如：企业开办一件事"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">场景描述</label>
                                    <textarea
                                        value={newScenario.description}
                                        onChange={(e) => setNewScenario({ ...newScenario, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm h-24 resize-none"
                                        placeholder="请描述业务场景的流程和目标..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">涉及对象</label>
                                    <div className="border border-slate-300 rounded-md p-2 max-h-32 overflow-y-auto">
                                        {businessObjects.map((bo) => (
                                            <label key={bo.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={newScenario.involvedObjects.includes(bo.name)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setNewScenario({
                                                                ...newScenario,
                                                                involvedObjects: [...newScenario.involvedObjects, bo.name]
                                                            });
                                                        } else {
                                                            setNewScenario({
                                                                ...newScenario,
                                                                involvedObjects: newScenario.involvedObjects.filter(name => name !== bo.name)
                                                            });
                                                        }
                                                    }}
                                                    className="rounded"
                                                />
                                                <span>{bo.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSaveScenario}
                                    disabled={!newScenario.name}
                                    className={`px-4 py-2 text-sm text-white rounded-md transition-colors shadow-sm ${!newScenario.name ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                                        }`}
                                >
                                    创建场景
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                isCanvasFull && (
                    <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm p-6">
                        <div className="w-full h-full">
                            {renderCanvasPanel(true)}
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ScenarioOrchestrationView;
