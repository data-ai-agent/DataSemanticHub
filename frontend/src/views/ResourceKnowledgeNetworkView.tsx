import { useEffect, useMemo, useRef, useState } from 'react';
import { Network, Box, Sparkles, RotateCcw, Play, Save, ZoomIn, ZoomOut, ChevronDown, ChevronUp, Pencil, Trash2, X, Target, Grid3x3, Maximize } from 'lucide-react';

type ObjectType = 'entity' | 'event' | 'rule' | 'attribute' | 'state';
type KnowledgeNode = {
    id: string;
    label: string;
    objectType: ObjectType;
    kind: 'object' | 'attribute';
    x: number;
    y: number;
    termId?: string;
};
type KnowledgeEdge = {
    id: string;
    from: string;
    to: string;
    label: string;
};
type Term = {
    id: string;
    name: string;
    objectType: ObjectType;
    definition?: string;
};

const OBJECT_TYPE_LABELS: Record<ObjectType, string> = {
    entity: '主体',
    event: '行为',
    rule: '规则',
    attribute: '属性',
    state: '状态'
};

const OBJECT_TYPE_STYLES: Record<ObjectType, { badge: string; node: string; dot: string }> = {
    entity: {
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        node: 'bg-blue-50 border-blue-200 text-blue-800 shadow-[0_10px_30px_-18px_rgba(30,64,175,0.7)]',
        dot: 'bg-blue-500'
    },
    event: {
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        node: 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-[0_10px_30px_-18px_rgba(5,150,105,0.7)]',
        dot: 'bg-emerald-500'
    },
    rule: {
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        node: 'bg-amber-50 border-amber-200 text-amber-900 shadow-[0_10px_30px_-18px_rgba(217,119,6,0.7)]',
        dot: 'bg-amber-400'
    },
    attribute: {
        badge: 'bg-slate-50 text-slate-600 border-slate-200',
        node: 'bg-white border-slate-200 text-slate-700 shadow-sm',
        dot: 'bg-slate-300'
    },
    state: {
        badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        node: 'bg-cyan-50 border-cyan-200 text-cyan-800 shadow-[0_10px_30px_-18px_rgba(8,145,178,0.7)]',
        dot: 'bg-cyan-500'
    }
};

const initialNodes: KnowledgeNode[] = [
    { id: 'obj_order', label: '订单', objectType: 'entity', kind: 'object', x: 16, y: 22 },
    { id: 'obj_user', label: '用户', objectType: 'entity', kind: 'object', x: 38, y: 12 },
    { id: 'obj_product', label: '商品', objectType: 'entity', kind: 'object', x: 66, y: 22 },
    { id: 'obj_inventory', label: '库存', objectType: 'entity', kind: 'object', x: 72, y: 54 },
    { id: 'obj_supplier', label: '供应商', objectType: 'entity', kind: 'object', x: 50, y: 70 },
    { id: 'obj_delivery', label: '物流运单', objectType: 'event', kind: 'object', x: 24, y: 64 },
    { id: 'obj_payment', label: '支付', objectType: 'event', kind: 'object', x: 12, y: 46 },
    { id: 'obj_promotion_rule', label: '满减规则', objectType: 'rule', kind: 'object', x: 40, y: 34 },
    { id: 'obj_order_state', label: '订单状态', objectType: 'state', kind: 'object', x: 22, y: 30 },
    { id: 'attr_order_id', label: '订单编号', objectType: 'attribute', kind: 'attribute', x: 6, y: 18 },
    { id: 'attr_user_id', label: '用户编号', objectType: 'attribute', kind: 'attribute', x: 30, y: 6 },
    { id: 'attr_user_level', label: '会员等级', objectType: 'attribute', kind: 'attribute', x: 46, y: 6 },
    { id: 'attr_product_id', label: '商品编号', objectType: 'attribute', kind: 'attribute', x: 82, y: 18 },
    { id: 'attr_product_type', label: '品类', objectType: 'attribute', kind: 'attribute', x: 82, y: 28 },
    { id: 'attr_delivery_no', label: '运单号', objectType: 'attribute', kind: 'attribute', x: 10, y: 70 },
    { id: 'attr_inventory_qty', label: '库存数量', objectType: 'attribute', kind: 'attribute', x: 84, y: 60 },
];

const initialEdges: KnowledgeEdge[] = [
    { id: 'edge_1', from: 'obj_order', to: 'obj_user', label: '下单人' },
    { id: 'edge_2', from: 'obj_order', to: 'obj_product', label: '包含商品' },
    { id: 'edge_3', from: 'obj_order', to: 'obj_payment', label: '支付关联' },
    { id: 'edge_4', from: 'obj_order', to: 'obj_delivery', label: '履约' },
    { id: 'edge_5', from: 'obj_product', to: 'obj_inventory', label: '库存占用' },
    { id: 'edge_6', from: 'obj_product', to: 'obj_supplier', label: '供给' },
    { id: 'edge_7', from: 'obj_inventory', to: 'obj_delivery', label: '出库' },
    { id: 'edge_8', from: 'obj_order', to: 'obj_promotion_rule', label: '约束' },
    { id: 'edge_9', from: 'obj_order', to: 'obj_order_state', label: '状态' },
    { id: 'edge_10', from: 'obj_order', to: 'attr_order_id', label: '拥有' },
    { id: 'edge_11', from: 'obj_user', to: 'attr_user_id', label: '拥有' },
    { id: 'edge_12', from: 'obj_user', to: 'attr_user_level', label: '拥有' },
    { id: 'edge_13', from: 'obj_product', to: 'attr_product_id', label: '拥有' },
    { id: 'edge_14', from: 'obj_product', to: 'attr_product_type', label: '拥有' },
    { id: 'edge_15', from: 'obj_delivery', to: 'attr_delivery_no', label: '拥有' },
    { id: 'edge_16', from: 'obj_inventory', to: 'attr_inventory_qty', label: '拥有' },
];

const STORAGE_KEY = 'semantic_resource_network_layout_v1';
const RELATIONSHIP_TYPES = ['拥有', '包含', '隶属于', '管理', '依赖', '引用', '产出', '消费', '触发', '约束'];
const RELATIONSHIP_QUICK = ['拥有', '包含', '隶属于', '触发', '约束', '归属', '依赖'];

const buildOntologyFromPrompt = (prompt: string): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } => {
    const normalized = prompt.toLowerCase();
    const isRetail = normalized.includes('零售') || normalized.includes('供应链') || normalized.includes('retail');
    const baseNodes = isRetail ? [
        { id: 'entity_user', label: '用户', objectType: 'entity', kind: 'object', x: 16, y: 18 },
        { id: 'entity_order', label: '订单', objectType: 'entity', kind: 'object', x: 36, y: 24 },
        { id: 'entity_product', label: '商品', objectType: 'entity', kind: 'object', x: 64, y: 22 },
        { id: 'entity_supplier', label: '供应商', objectType: 'entity', kind: 'object', x: 78, y: 48 },
        { id: 'entity_inventory', label: '库存', objectType: 'entity', kind: 'object', x: 56, y: 58 },
        { id: 'event_payment', label: '支付', objectType: 'event', kind: 'object', x: 18, y: 44 },
        { id: 'event_delivery', label: '物流运单', objectType: 'event', kind: 'object', x: 30, y: 64 },
        { id: 'rule_discount', label: '满减规则', objectType: 'rule', kind: 'object', x: 46, y: 40 },
        { id: 'state_order', label: '订单状态', objectType: 'state', kind: 'object', x: 50, y: 26 },
        { id: 'attr_user_id', label: '用户编号', objectType: 'attribute', kind: 'attribute', x: 6, y: 10 },
        { id: 'attr_user_level', label: '会员等级', objectType: 'attribute', kind: 'attribute', x: 24, y: 8 },
        { id: 'attr_order_id', label: '订单编号', objectType: 'attribute', kind: 'attribute', x: 26, y: 16 },
        { id: 'attr_order_amount', label: '订单金额', objectType: 'attribute', kind: 'attribute', x: 34, y: 12 },
        { id: 'attr_product_id', label: '商品编号', objectType: 'attribute', kind: 'attribute', x: 72, y: 12 },
        { id: 'attr_product_type', label: '品类', objectType: 'attribute', kind: 'attribute', x: 78, y: 20 },
        { id: 'attr_delivery_no', label: '运单号', objectType: 'attribute', kind: 'attribute', x: 20, y: 72 },
    ] : [
        { id: 'entity_customer', label: '客户', objectType: 'entity', kind: 'object', x: 24, y: 24 },
        { id: 'entity_contract', label: '合同', objectType: 'entity', kind: 'object', x: 50, y: 28 },
        { id: 'entity_product', label: '产品', objectType: 'entity', kind: 'object', x: 72, y: 24 },
        { id: 'event_delivery', label: '交付', objectType: 'event', kind: 'object', x: 40, y: 52 },
        { id: 'rule_sla', label: 'SLA规则', objectType: 'rule', kind: 'object', x: 60, y: 44 },
        { id: 'state_contract', label: '合同状态', objectType: 'state', kind: 'object', x: 56, y: 20 },
        { id: 'attr_customer_id', label: '客户编号', objectType: 'attribute', kind: 'attribute', x: 12, y: 12 },
        { id: 'attr_contract_id', label: '合同编号', objectType: 'attribute', kind: 'attribute', x: 44, y: 12 },
        { id: 'attr_product_id', label: '产品编号', objectType: 'attribute', kind: 'attribute', x: 84, y: 12 },
    ];

    const baseEdges = isRetail ? [
        { id: 'edge_1', from: 'entity_order', to: 'entity_user', label: '拥有' },
        { id: 'edge_2', from: 'entity_order', to: 'entity_product', label: '包含' },
        { id: 'edge_3', from: 'entity_order', to: 'event_payment', label: '触发' },
        { id: 'edge_4', from: 'entity_order', to: 'event_delivery', label: '履约' },
        { id: 'edge_5', from: 'entity_product', to: 'entity_inventory', label: '库存占用' },
        { id: 'edge_6', from: 'entity_product', to: 'entity_supplier', label: '供给' },
        { id: 'edge_7', from: 'entity_order', to: 'rule_discount', label: '约束' },
        { id: 'edge_8', from: 'entity_order', to: 'state_order', label: '状态' },
        { id: 'edge_9', from: 'entity_order', to: 'attr_order_id', label: '拥有' },
        { id: 'edge_10', from: 'entity_user', to: 'attr_user_id', label: '拥有' },
        { id: 'edge_11', from: 'entity_user', to: 'attr_user_level', label: '拥有' },
        { id: 'edge_12', from: 'entity_order', to: 'attr_order_amount', label: '拥有' },
        { id: 'edge_13', from: 'entity_product', to: 'attr_product_id', label: '拥有' },
        { id: 'edge_14', from: 'entity_product', to: 'attr_product_type', label: '拥有' },
        { id: 'edge_15', from: 'event_delivery', to: 'attr_delivery_no', label: '拥有' }
    ] : [
        { id: 'edge_1', from: 'entity_contract', to: 'entity_customer', label: '签署' },
        { id: 'edge_2', from: 'entity_contract', to: 'entity_product', label: '包含' },
        { id: 'edge_3', from: 'entity_contract', to: 'event_delivery', label: '驱动' },
        { id: 'edge_4', from: 'entity_contract', to: 'rule_sla', label: '约束' },
        { id: 'edge_5', from: 'entity_contract', to: 'state_contract', label: '状态' },
        { id: 'edge_6', from: 'entity_customer', to: 'attr_customer_id', label: '拥有' },
        { id: 'edge_7', from: 'entity_contract', to: 'attr_contract_id', label: '拥有' },
        { id: 'edge_8', from: 'entity_product', to: 'attr_product_id', label: '拥有' }
    ];

    return { nodes: baseNodes as KnowledgeNode[], edges: baseEdges };
};

const ResourceKnowledgeNetworkView = () => {
    const [nodeList, setNodeList] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
    const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
    const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | ObjectType>('all');
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [newNodeName, setNewNodeName] = useState('');
    const [newNodeKind, setNewNodeKind] = useState<'object' | 'attribute'>('object');
    const [newNodeType, setNewNodeType] = useState<ObjectType>('entity');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [showAgentPanel, setShowAgentPanel] = useState(false);
    const [agentPrompt, setAgentPrompt] = useState('帮我构建一套零售供应链的业务对象模型');
    const [isGenerating, setIsGenerating] = useState(false);
    const [terms, setTerms] = useState<Term[]>([
        { id: 'term_user', name: '用户', objectType: 'entity', definition: '系统内的下单主体。' },
        { id: 'term_order', name: '订单', objectType: 'entity', definition: '交易过程形成的业务单据。' },
        { id: 'term_product', name: '商品', objectType: 'entity', definition: '可售卖的业务对象。' },
        { id: 'term_payment', name: '支付', objectType: 'event', definition: '资金完成结算的行为。' }
    ]);
    const [termModalOpen, setTermModalOpen] = useState(false);
    const [termSearch, setTermSearch] = useState('');
    const [termName, setTermName] = useState('');
    const [termDefinition, setTermDefinition] = useState('');
    const [termObjectType, setTermObjectType] = useState<ObjectType>('entity');
    const [termTargetNodeId, setTermTargetNodeId] = useState<string | null>(null);
    const [nodeTags, setNodeTags] = useState<Record<string, string[]>>({});
    const [nodeFields, setNodeFields] = useState<Record<string, string[]>>({});
    const [newTag, setNewTag] = useState('');
    const [newField, setNewField] = useState('');
    const [edgeStyles, setEdgeStyles] = useState<Record<string, { style: 'solid' | 'dashed'; weight: number; directed: boolean }>>({});
    const [layoutPresets, setLayoutPresets] = useState<{ id: string; name: string; positions: Record<string, { x: number; y: number }> }[]>([]);
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
    const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>(() => {
        if (typeof window === 'undefined') {
            return Object.fromEntries(initialNodes.map(node => [node.id, { x: node.x, y: node.y }]));
        }
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as Record<string, { x: number; y: number }>;
            }
        } catch (error) {
            console.warn('Failed to restore layout', error);
        }
        return Object.fromEntries(initialNodes.map(node => [node.id, { x: node.x, y: node.y }]));
    });
    const canvasRef = useRef<HTMLDivElement>(null);
    const getNode = (id: string) => nodeList.find(node => node.id === id);
    const objectNodes = nodeList.filter(node => node.objectType !== 'attribute');
    const [selectedSource, setSelectedSource] = useState(objectNodes[0]?.id || '');
    const [selectedTarget, setSelectedTarget] = useState(objectNodes[1]?.id || '');
    const [relationshipName, setRelationshipName] = useState('拥有');
    const [relationshipType, setRelationshipType] = useState('拥有');
    const [detailTab, setDetailTab] = useState<'node' | 'edge'>('node');
    const [rightTab, setRightTab] = useState<'model' | 'search'>('model');
    const [detailCompact, setDetailCompact] = useState(true);
    const [rightStep, setRightStep] = useState<'select' | 'detail' | 'relation' | 'search'>('select');
    const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);
    const [openPanels, setOpenPanels] = useState({
        relation: true,
        batch: false,
        api: false,
        action: false,
        function: false
    });
    const selectedNode = selectedNodeId ? getNode(selectedNodeId) : null;
    const selectedEdge = selectedEdgeId ? edges.find(edge => edge.id === selectedEdgeId) : null;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchedEdgeIds = new Set(
        edges.filter(edge => normalizedSearch && edge.label.toLowerCase().includes(normalizedSearch)).map(edge => edge.id)
    );
    const matchedNodeIds = new Set(
        nodeList.filter(node => normalizedSearch && node.label.toLowerCase().includes(normalizedSearch)).map(node => node.id)
    );
    edges.forEach(edge => {
        if (matchedEdgeIds.has(edge.id)) {
            matchedNodeIds.add(edge.from);
            matchedNodeIds.add(edge.to);
        }
    });
    const filteredNodes = nodeList.filter(node => {
        const matchesSearch = !normalizedSearch || matchedNodeIds.has(node.id);
        const matchesType = filterType === 'all' || node.objectType === filterType;
        return matchesSearch && matchesType;
    });
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredEdges = edges.filter(edge => {
        if (normalizedSearch && matchedEdgeIds.has(edge.id)) return true;
        return filteredNodeIds.has(edge.from) && filteredNodeIds.has(edge.to);
    });
    const selectedNodeLinks = useMemo(() => {
        if (!selectedNodeId) return [];
        return edges.filter(edge => edge.from === selectedNodeId || edge.to === selectedNodeId);
    }, [edges, selectedNodeId]);
    const termById = useMemo(() => Object.fromEntries(terms.map(term => [term.id, term])), [terms]);
    const relationshipSuggestions = useMemo(() => {
        const sourceType = getNode(selectedSource)?.objectType;
        const targetType = getNode(selectedTarget)?.objectType;
        const suggestions = new Set<string>();
        RELATIONSHIP_QUICK.forEach(item => suggestions.add(item));
        if (sourceType === 'event' || targetType === 'event') {
            ['触发', '发生', '关联'].forEach(item => suggestions.add(item));
        }
        if (sourceType === 'rule' || targetType === 'rule') {
            ['约束', '适用', '命中'].forEach(item => suggestions.add(item));
        }
        if (sourceType === 'state' || targetType === 'state') {
            ['状态', '流转', '进入'].forEach(item => suggestions.add(item));
        }
        if (sourceType === 'entity' && targetType === 'entity') {
            ['包含', '隶属于', '供给'].forEach(item => suggestions.add(item));
        }
        return Array.from(suggestions).slice(0, 10);
    }, [selectedSource, selectedTarget, nodeList]);

    const handleCreateRelationship = () => {
        if (!selectedSource || !selectedTarget || !relationshipName.trim()) return;
        if (selectedSource === selectedTarget) return;
        const normalizedLabel = relationshipName.trim();
        if (!editingEdgeId) {
            const exists = edges.some(edge => edge.from === selectedSource && edge.to === selectedTarget && edge.label === normalizedLabel);
            if (exists) return;
        }
        setEdges(prev => {
            if (editingEdgeId) {
                return prev.map(edge => edge.id === editingEdgeId ? { ...edge, from: selectedSource, to: selectedTarget, label: normalizedLabel } : edge);
            }
            return [
                ...prev,
                {
                    id: `edge_${Date.now()}`,
                    from: selectedSource,
                    to: selectedTarget,
                    label: normalizedLabel
                }
            ];
        });
        setEditingEdgeId(null);
        setSelectedEdgeId(null);
        setSelectedEdgeIds([]);
        setRelationshipName('拥有');
    };

    const handleEditEdge = (edgeId: string) => {
        const edge = edges.find(item => item.id === edgeId);
        if (!edge) return;
        setEditingEdgeId(edge.id);
        setSelectedSource(edge.from);
        setSelectedTarget(edge.to);
        setRelationshipName(edge.label);
        setRelationshipType(RELATIONSHIP_TYPES.includes(edge.label) ? edge.label : '自定义');
        setSelectedEdgeId(edge.id);
        setSelectedEdgeIds([edge.id]);
        setSelectedNodeId(null);
        setSelectedNodeIds([]);
    };

    const handleDeleteEdge = (edgeId: string) => {
        setEdges(prev => prev.filter(edge => edge.id !== edgeId));
        if (selectedEdgeId === edgeId) {
            setSelectedEdgeId(null);
        }
        setSelectedEdgeIds(prev => prev.filter(id => id !== edgeId));
        if (editingEdgeId === edgeId) {
            setEditingEdgeId(null);
        }
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nodePositions));
        } catch (error) {
            console.warn('Failed to persist layout', error);
        }
    }, [nodePositions]);

    useEffect(() => {
        if (rightStep === 'search') return;
        if (selectedEdgeId || editingEdgeId) {
            setRightStep('relation');
            return;
        }
        if (selectedNodeId || selectedNodeIds.length > 0) {
            setRightStep('detail');
        }
    }, [editingEdgeId, rightStep, selectedEdgeId, selectedNodeId, selectedNodeIds.length]);

    useEffect(() => {
        if (!objectNodes.find(node => node.id === selectedSource)) {
            setSelectedSource(objectNodes[0]?.id || '');
        }
        if (!objectNodes.find(node => node.id === selectedTarget)) {
            setSelectedTarget(objectNodes[1]?.id || objectNodes[0]?.id || '');
        }
    }, [objectNodes, selectedSource, selectedTarget]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
                    event.preventDefault();
                    handleBatchDelete();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeIds, selectedEdgeIds]);

    useEffect(() => {
        if (!isCanvasFullscreen) return;
        const handleExit = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsCanvasFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleExit);
        return () => window.removeEventListener('keydown', handleExit);
    }, [isCanvasFullscreen]);

    useEffect(() => {
        if (!isCanvasFullscreen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isCanvasFullscreen]);

    const handleAutoLayout = () => {
        const objectList = nodeList.filter(node => node.objectType !== 'attribute');
        const attributeList = nodeList.filter(node => node.objectType === 'attribute');
        const nextPositions: Record<string, { x: number; y: number }> = {};
        const centerX = 50;
        const centerY = 50;
        const radius = 28;
        objectList.forEach((node, idx) => {
            const angle = (idx / objectList.length) * Math.PI * 2;
            nextPositions[node.id] = {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            };
        });
        attributeList.forEach((node, idx) => {
            const angle = (idx / attributeList.length) * Math.PI * 2;
            nextPositions[node.id] = {
                x: centerX + Math.cos(angle) * (radius + 16),
                y: centerY + Math.sin(angle) * (radius + 16)
            };
        });
        setNodePositions(nextPositions);
    };

    const handleReset = () => {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setSelectedNodeIds([]);
        setSelectedEdgeIds([]);
        setEditingEdgeId(null);
        setSearchTerm('');
        setFilterType('all');
        setRelationshipName('拥有');
        setRelationshipType('拥有');
        setZoomLevel(1);
        setNodePositions(Object.fromEntries(nodeList.map(node => [node.id, { x: node.x, y: node.y }])));
    };

    const handleZoom = (delta: number) => {
        setZoomLevel(prev => Math.max(0.6, Math.min(1.6, parseFloat((prev + delta).toFixed(2)))));
    };

    const handleUpdateNode = (nodeId: string, updates: Partial<KnowledgeNode>) => {
        setNodeList(prev => prev.map(node => node.id === nodeId ? { ...node, ...updates } : node));
    };

    const handleAddNode = () => {
        const trimmedName = newNodeName.trim();
        if (!trimmedName) return;
        const kind = newNodeKind;
        const id = `node_${Date.now()}`;
        const position = { x: 52, y: 44 };
        setNodeList(prev => ([
            ...prev,
            {
                id,
                label: trimmedName,
                objectType: kind === 'attribute' ? 'attribute' : newNodeType,
                kind,
                x: position.x,
                y: position.y
            }
        ]));
        setNodePositions(prev => ({ ...prev, [id]: position }));
        setNewNodeName('');
        setSelectedNodeId(id);
        setSelectedNodeIds([id]);
    };

    const handleNodeSelect = (event: React.MouseEvent<HTMLDivElement>, nodeId: string) => {
        event.stopPropagation();
        setDetailTab('node');
        if (event.metaKey || event.ctrlKey) {
            setSelectedNodeIds(prev => (prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]));
            setSelectedNodeId(nodeId);
        } else {
            setSelectedNodeIds([nodeId]);
            setSelectedNodeId(nodeId);
        }
        setSelectedEdgeId(null);
        setSelectedEdgeIds([]);
    };

    const handleEdgeSelect = (event: React.MouseEvent<Element>, edgeId: string) => {
        event.stopPropagation();
        setDetailTab('edge');
        if (event.metaKey || event.ctrlKey) {
            setSelectedEdgeIds(prev => (prev.includes(edgeId) ? prev.filter(id => id !== edgeId) : [...prev, edgeId]));
            setSelectedEdgeId(edgeId);
        } else {
            setSelectedEdgeIds([edgeId]);
            setSelectedEdgeId(edgeId);
        }
        setSelectedNodeId(null);
        setSelectedNodeIds([]);
    };

    const handleBatchDelete = () => {
        const nodeDeleteSet = new Set(selectedNodeIds);
        const edgeDeleteSet = new Set(selectedEdgeIds);
        if (nodeDeleteSet.size === 0 && edgeDeleteSet.size === 0) return;
        setNodeList(prev => prev.filter(node => !nodeDeleteSet.has(node.id)));
        setEdges(prev => prev.filter(edge => {
            const hitNode = nodeDeleteSet.has(edge.from) || nodeDeleteSet.has(edge.to);
            return !hitNode && !edgeDeleteSet.has(edge.id);
        }));
        setNodePositions(prev => {
            const next = { ...prev };
            nodeDeleteSet.forEach(id => {
                delete next[id];
            });
            return next;
        });
        if (selectedNodeId && nodeDeleteSet.has(selectedNodeId)) {
            setSelectedNodeId(null);
        }
        if (selectedEdgeId && edgeDeleteSet.has(selectedEdgeId)) {
            setSelectedEdgeId(null);
        }
        setSelectedNodeIds([]);
        setSelectedEdgeIds([]);
    };

    const handleNodePointerDown = (nodeId: string) => {
        setDraggingNodeId(nodeId);
    };

    const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!draggingNodeId || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const nextX = ((event.clientX - rect.left) / rect.width) * 100 / zoomLevel;
        const nextY = ((event.clientY - rect.top) / rect.height) * 100 / zoomLevel;
        const snap = (value: number) => {
            const step = 2;
            return Math.round(value / step) * step;
        };
        const resolvedX = snapToGrid ? snap(nextX) : nextX;
        const resolvedY = snapToGrid ? snap(nextY) : nextY;
        setNodePositions(prev => ({
            ...prev,
            [draggingNodeId]: {
                x: Math.max(4, Math.min(96, resolvedX)),
                y: Math.max(6, Math.min(94, resolvedY))
            }
        }));
    };

    const handleCanvasPointerUp = () => {
        setDraggingNodeId(null);
    };

    const openTermModal = (nodeId: string) => {
        const node = getNode(nodeId);
        if (!node) return;
        setTermTargetNodeId(nodeId);
        setTermObjectType(node.objectType);
        setTermName(node.label);
        setTermDefinition('');
        setTermSearch('');
        setTermModalOpen(true);
    };

    const handleBindTerm = (termId: string) => {
        if (!termTargetNodeId) return;
        setNodeList(prev => prev.map(node => node.id === termTargetNodeId ? { ...node, termId } : node));
        setTermModalOpen(false);
    };

    const handleCreateTerm = () => {
        if (!termTargetNodeId || !termName.trim()) return;
        const newTerm = {
            id: `term_${Date.now()}`,
            name: termName.trim(),
            objectType: termObjectType,
            definition: termDefinition.trim()
        };
        setTerms(prev => [...prev, newTerm]);
        setNodeList(prev => prev.map(node => node.id === termTargetNodeId ? { ...node, termId: newTerm.id } : node));
        setTermModalOpen(false);
    };

    const handleAgentBuild = () => {
        if (!agentPrompt.trim()) return;
        setIsGenerating(true);
        const { nodes, edges: nextEdges } = buildOntologyFromPrompt(agentPrompt);
        setNodeList(nodes);
        setEdges(nextEdges);
        setNodePositions(Object.fromEntries(nodes.map(node => [node.id, { x: node.x, y: node.y }])));
        setNodeTags({});
        setNodeFields({});
        setEdgeStyles({});
        setLayoutPresets([]);
        setSelectedLayoutId(null);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setSelectedNodeIds([]);
        setSelectedEdgeIds([]);
        setIsGenerating(false);
    };

    const handleSaveLayout = () => {
        const name = `布局 ${layoutPresets.length + 1}`;
        const next = { id: `layout_${Date.now()}`, name, positions: nodePositions };
        setLayoutPresets(prev => [...prev, next]);
        setSelectedLayoutId(next.id);
    };

    const handleApplyLayout = (layoutId: string) => {
        const preset = layoutPresets.find(item => item.id === layoutId);
        if (!preset) return;
        setNodePositions(preset.positions);
        setSelectedLayoutId(layoutId);
    };

    const handleExportJson = () => {
        const payload = {
            nodes: nodeList.map(node => ({
                ...node,
                position: nodePositions[node.id] || { x: node.x, y: node.y },
                tags: nodeTags[node.id] || [],
                fields: nodeFields[node.id] || []
            })),
            edges: edges.map(edge => ({
                ...edge,
                style: edgeStyles[edge.id] || { style: 'solid', weight: 2, directed: true }
            }))
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'resource-knowledge-network.json';
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const centerOnNode = (nodeId: string) => {
        const target = nodePositions[nodeId] || { x: 50, y: 50 };
        const dx = 50 - target.x;
        const dy = 50 - target.y;
        setNodePositions(prev => Object.fromEntries(
            Object.entries(prev).map(([id, pos]) => ([
                id,
                {
                    x: Math.max(6, Math.min(94, pos.x + dx)),
                    y: Math.max(8, Math.min(92, pos.y + dy))
                }
            ]))
        ));
    };

    const centerOnNodes = (nodeIds: string[]) => {
        if (nodeIds.length === 0) return;
        const positions = nodeIds.map(id => {
            const node = getNode(id);
            const fallback = node ? { x: node.x, y: node.y } : { x: 50, y: 50 };
            return nodePositions[id] || fallback;
        });
        const avgX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
        const avgY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;
        const dx = 50 - avgX;
        const dy = 50 - avgY;
        setNodePositions(prev => Object.fromEntries(
            Object.entries(prev).map(([id, pos]) => ([
                id,
                {
                    x: Math.max(6, Math.min(94, pos.x + dx)),
                    y: Math.max(8, Math.min(92, pos.y + dy))
                }
            ]))
        ));
    };

    const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.currentTarget !== event.target || draggingNodeId) return;
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const startX = (event.clientX - rect.left) / zoomLevel;
        const startY = (event.clientY - rect.top) / zoomLevel;
        setIsSelecting(true);
        setSelectionStart({ x: startX, y: startY });
        setSelectionRect({ x: startX, y: startY, width: 0, height: 0 });
    };

    const handleSelectionMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!isSelecting || !selectionStart || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = (event.clientX - rect.left) / zoomLevel;
        const currentY = (event.clientY - rect.top) / zoomLevel;
        const x = Math.min(selectionStart.x, currentX);
        const y = Math.min(selectionStart.y, currentY);
        const width = Math.abs(selectionStart.x - currentX);
        const height = Math.abs(selectionStart.y - currentY);
        setSelectionRect({ x, y, width, height });
    };

    const handleSelectionEnd = () => {
        if (!isSelecting || !selectionRect || !canvasRef.current) {
            setIsSelecting(false);
            setSelectionStart(null);
            setSelectionRect(null);
            return;
        }
        const rect = canvasRef.current.getBoundingClientRect();
        const selected = filteredNodes.filter(node => {
            const pos = nodePositions[node.id] || { x: node.x, y: node.y };
            const px = (pos.x / 100) * rect.width;
            const py = (pos.y / 100) * rect.height;
            return (
                px >= selectionRect.x &&
                px <= selectionRect.x + selectionRect.width &&
                py >= selectionRect.y &&
                py <= selectionRect.y + selectionRect.height
            );
        }).map(node => node.id);
        if (selected.length > 0) {
            setSelectedNodeIds(selected);
            setSelectedNodeId(selected[selected.length - 1]);
            setSelectedEdgeId(null);
            setSelectedEdgeIds([]);
        }
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionRect(null);
    };

    const canvasHeightClass = isCanvasFullscreen
        ? 'h-[calc(100vh-220px)] min-h-[520px]'
        : 'h-[620px]';

    const canvasPanel = (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${isCanvasFullscreen ? 'h-full' : ''}`}>
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Box size={14} /> 本体构建
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowAgentPanel(prev => !prev)}
                            className="px-3 py-1.5 text-xs rounded-full border border-blue-200 bg-blue-50 text-blue-600 flex items-center gap-2"
                        >
                            <Network size={12} /> 本体构建 Agent
                        </button>
                        <button
                            onClick={handleAutoLayout}
                            className="px-3 py-1.5 text-xs rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Sparkles size={12} /> 自动布局
                        </button>
                        <button
                            onClick={handleSaveLayout}
                            className="px-3 py-1.5 text-xs rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        >
                            保存布局
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">快捷操作</div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => centerOnNodes(selectedNodeIds.length > 0 ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [])}
                            disabled={selectedNodeIds.length === 0 && !selectedNodeId}
                            className="px-3 py-1.5 text-xs rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Target size={12} /> 聚焦选中
                        </button>
                        <button
                            onClick={() => setSnapToGrid(prev => !prev)}
                            className={`px-3 py-1.5 text-xs rounded-full border flex items-center gap-2 ${snapToGrid ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Grid3x3 size={12} /> 吸附网格
                        </button>
                        <button
                            onClick={() => setIsCanvasFullscreen(prev => !prev)}
                            className={`px-3 py-1.5 text-xs rounded-full border flex items-center gap-2 ${isCanvasFullscreen ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                            <Maximize size={12} /> {isCanvasFullscreen ? '退出全屏' : '全屏'}
                        </button>
                        <button
                            onClick={handleExportJson}
                            className="px-3 py-1.5 text-xs rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        >
                            导出 JSON
                        </button>
                        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500">
                            <button onClick={() => handleZoom(0.1)} className="p-1 hover:text-slate-700"><ZoomIn size={12} /></button>
                            <button onClick={() => handleZoom(-0.1)} className="p-1 hover:text-slate-700"><ZoomOut size={12} /></button>
                            <span className="px-2">{Math.round(zoomLevel * 100)}%</span>
                        </div>
                    </div>
                </div>
            </div>
            {showAgentPanel && (
                <div className="border-b border-slate-100 bg-white px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-sm font-semibold text-slate-700">本体构建 Agent</div>
                            <div className="text-xs text-slate-500 mt-1">
                                输入业务场景，AI 将自动生成主体、行为、规则与属性节点，完成冷启动建模。
                            </div>
                        </div>
                        <button
                            onClick={() => setShowAgentPanel(false)}
                            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>
                    </div>
                    <div className="mt-3 space-y-3">
                        <textarea
                            value={agentPrompt}
                            onChange={(event) => setAgentPrompt(event.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={handleAgentBuild}
                                disabled={isGenerating}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm flex items-center gap-2 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <Sparkles size={14} /> {isGenerating ? '生成中' : '生成模型'}
                            </button>
                            <div className="text-xs text-slate-500">
                                示例：帮我构建一套零售供应链的业务对象模型
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div
                ref={canvasRef}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={(event) => {
                    handleCanvasPointerMove(event);
                    handleSelectionMove(event);
                }}
                onPointerUp={() => {
                    handleCanvasPointerUp();
                    handleSelectionEnd();
                }}
                onPointerLeave={() => {
                    handleCanvasPointerUp();
                    handleSelectionEnd();
                }}
                className={`relative ${canvasHeightClass} bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_rgba(255,255,255,0.4)_55%,_transparent_75%)]`}
            >
                <div
                    className="absolute inset-0 origin-center transition-transform duration-150"
                    style={{ transform: `scale(${zoomLevel})` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:36px_36px]" />
                    <svg className="absolute inset-0 w-full h-full">
                        {filteredEdges.map((edge, idx) => {
                            const from = getNode(edge.from);
                            const to = getNode(edge.to);
                            if (!from || !to) return null;
                            const isSelected = selectedEdgeIds.includes(edge.id);
                            const isMatched = matchedEdgeIds.has(edge.id);
                            const edgeStyle = edgeStyles[edge.id] || { style: 'solid', weight: 2, directed: true };
                            const fromPos = nodePositions[from.id];
                            const toPos = nodePositions[to.id];
                            return (
                                <g
                                    key={edge.id}
                                    onClick={(event) => handleEdgeSelect(event, edge.id)}
                                    onDoubleClick={() => handleEditEdge(edge.id)}
                                    onMouseEnter={() => setHoveredEdgeId(edge.id)}
                                    onMouseLeave={() => setHoveredEdgeId(null)}
                                    className="cursor-pointer"
                                >
                                    <line
                                        x1={`${fromPos?.x ?? from.x}%`}
                                        y1={`${fromPos?.y ?? from.y}%`}
                                        x2={`${toPos?.x ?? to.x}%`}
                                        y2={`${toPos?.y ?? to.y}%`}
                                        stroke={isSelected ? 'rgba(37,99,235,0.8)' : hoveredEdgeId === edge.id ? 'rgba(59,130,246,0.55)' : isMatched ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.35)'}
                                        strokeWidth={isSelected ? edgeStyle.weight + 1 : hoveredEdgeId === edge.id ? edgeStyle.weight + 0.5 : isMatched ? edgeStyle.weight + 0.5 : edgeStyle.weight}
                                        strokeDasharray={edgeStyle.style === 'dashed' ? '6 6' : '0'}
                                    />
                                    {edgeStyle.directed && (
                                        <circle
                                            cx={`${((fromPos?.x ?? from.x) + (toPos?.x ?? to.x)) / 2}%`}
                                            cy={`${((fromPos?.y ?? from.y) + (toPos?.y ?? to.y)) / 2}%`}
                                            r="3"
                                            fill="rgba(59,130,246,0.6)"
                                        />
                                    )}
                                    <text
                                        x={`${((fromPos?.x ?? from.x) + (toPos?.x ?? to.x)) / 2}%`}
                                        y={`${((fromPos?.y ?? from.y) + (toPos?.y ?? to.y)) / 2 - 1.5}%`}
                                        fill="#64748b"
                                        fontSize="11"
                                        textAnchor="middle"
                                    >
                                        {edge.label}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                    {filteredNodes.map(node => (
                        <div
                            key={node.id}
                            onClick={(event) => handleNodeSelect(event, node.id)}
                            onPointerDown={() => handleNodePointerDown(node.id)}
                            onDoubleClick={() => openTermModal(node.id)}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 border text-xs font-semibold cursor-pointer ${node.objectType === 'attribute'
                                ? `px-3 py-1 rounded-full ${OBJECT_TYPE_STYLES.attribute.node}`
                                : `px-4 py-2 rounded-2xl ${OBJECT_TYPE_STYLES[node.objectType].node}`
                                } ${selectedNodeIds.includes(node.id) ? 'ring-2 ring-blue-400 ring-offset-2' : ''} ${matchedNodeIds.has(node.id) ? 'ring-1 ring-amber-300' : ''}`}
                            style={{
                                left: `${nodePositions[node.id]?.x ?? node.x}%`,
                                top: `${nodePositions[node.id]?.y ?? node.y}%`
                            }}
                        >
                            {node.label}
                            {node.objectType !== 'attribute' && (
                                <div className="text-[10px] font-normal text-slate-500 mt-1">
                                    {OBJECT_TYPE_LABELS[node.objectType]}
                                </div>
                            )}
                            {node.termId && termById[node.termId] && (
                                <div className="mt-1 text-[10px] font-normal text-slate-400">
                                    标准术语：{termById[node.termId].name}
                                </div>
                            )}
                        </div>
                    ))}
                    {selectionRect && (
                        <div
                            className="absolute border border-blue-400 bg-blue-100/20"
                            style={{
                                left: selectionRect.x,
                                top: selectionRect.y,
                                width: selectionRect.width,
                                height: selectionRect.height
                            }}
                        />
                    )}
                    <div className="absolute bottom-4 left-4 rounded-2xl border border-slate-200 bg-white/90 px-4 py-2 text-xs text-slate-600 shadow">
                        体系色谱：
                        {(['entity', 'event', 'rule', 'state', 'attribute'] as ObjectType[]).map(type => (
                            <span key={type} className="ml-2 inline-flex items-center gap-1">
                                <span className={`w-2.5 h-2.5 rounded-full ${OBJECT_TYPE_STYLES[type].dot}`}></span>{OBJECT_TYPE_LABELS[type]}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-slate-700">
                        <Network size={20} className="text-blue-600" />
                        <h2 className="text-2xl font-bold tracking-tight">资源知识网络</h2>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        展示主体、行为、规则、状态与属性的知识网络，支持快速检索与关系维护。
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <RotateCcw size={14} /> 重置
                    </button>
                    <button className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                        <Play size={14} /> 验证
                    </button>
                    <button className="px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
                        <Save size={14} /> 保存
                    </button>
                </div>
            </div>

            {isCanvasFullscreen ? (
                <div className="fixed inset-0 z-50 bg-slate-950/40 p-6">
                    <div className="h-full relative">
                        <button
                            onClick={() => setIsCanvasFullscreen(false)}
                            className="absolute top-4 right-4 z-50 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm hover:bg-slate-50"
                        >
                            退出全屏 (Esc)
                        </button>
                        <div className="absolute bottom-4 right-4 z-40 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs text-slate-500 shadow-sm">
                            提示：Esc 退出全屏
                        </div>
                        {canvasPanel}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                    {canvasPanel}

                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-50">建模流程</div>
                            <div className="p-4 space-y-3 text-xs text-slate-500">
                                <div className="flex flex-wrap gap-2">
                                    {([
                                        { key: 'select', label: '选择对象' },
                                        { key: 'detail', label: '对象详情' },
                                        { key: 'relation', label: '关系定义' },
                                        { key: 'search', label: '检索/批量' }
                                    ] as const).map(step => (
                                        <button
                                            key={step.key}
                                            onClick={() => setRightStep(step.key)}
                                            className={`px-3 py-1 rounded-full border ${rightStep === step.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {step.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                                    当前选择：{selectedNodeIds.length} 个对象 / {selectedEdgeIds.length} 条关系
                                </div>
                            </div>
                        </div>

                        {rightStep === 'select' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-50">选择对象</div>
                                <div className="p-4 space-y-3 text-xs text-slate-500">
                                    <div>点击画布节点进行选择，拖拽框选可批量选择对象。</div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setRightStep('search')}
                                            className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                        >
                                            去检索
                                        </button>
                                        <button
                                            onClick={() => setRightStep('relation')}
                                            className="px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                        >
                                            去建关系
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {rightStep === 'detail' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-700 bg-slate-50">
                                    焦点详情
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setDetailCompact(prev => !prev)}
                                            className="px-2 py-1 rounded-full border border-slate-200 bg-white text-xs text-slate-500 hover:text-slate-700"
                                        >
                                            {detailCompact ? '展开' : '精简'}
                                        </button>
                                        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs">
                                            <button
                                                onClick={() => setDetailTab('node')}
                                                className={`px-3 py-1 rounded-full ${detailTab === 'node' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                对象
                                            </button>
                                            <button
                                                onClick={() => setDetailTab('edge')}
                                                className={`px-3 py-1 rounded-full ${detailTab === 'edge' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                            >
                                                关系
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3 text-sm text-slate-600">
                                    {detailTab === 'node' ? (
                                        selectedNode && selectedNodeIds.length <= 1 ? (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">名称</span>
                                                    <input
                                                        value={selectedNode.label}
                                                        onChange={(event) => handleUpdateNode(selectedNode.id, { label: event.target.value })}
                                                        className="text-right text-sm text-slate-800 bg-transparent border-b border-transparent focus:border-blue-400 outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">对象类型</span>
                                                    <select
                                                        value={selectedNode.objectType}
                                                        onChange={(event) => {
                                                            const nextType = event.target.value as ObjectType;
                                                            handleUpdateNode(selectedNode.id, {
                                                                objectType: nextType,
                                                                kind: nextType === 'attribute' ? 'attribute' : 'object'
                                                            });
                                                        }}
                                                        className="text-xs text-slate-600 border border-slate-200 rounded-md px-2 py-1 bg-white"
                                                    >
                                                        {(['entity', 'event', 'rule', 'state', 'attribute'] as ObjectType[]).map(type => (
                                                            <option key={type} value={type}>{OBJECT_TYPE_LABELS[type]}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-500">关系数量</span>
                                                    <span className="text-slate-800">{selectedNodeLinks.length}</span>
                                                </div>
                                                <div className="pt-2 border-t border-slate-100 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-500">标准术语</span>
                                                        <button
                                                            onClick={() => openTermModal(selectedNode.id)}
                                                            className="text-xs text-blue-600 hover:text-blue-700"
                                                        >
                                                            关联/创建
                                                        </button>
                                                    </div>
                                                    {selectedNode.termId && termById[selectedNode.termId] ? (
                                                        <div className="text-xs text-slate-600">
                                                            {termById[selectedNode.termId].name}
                                                            <span className={`ml-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${OBJECT_TYPE_STYLES[termById[selectedNode.termId].objectType].badge}`}>
                                                                {OBJECT_TYPE_LABELS[termById[selectedNode.termId].objectType]}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400">双击节点快速关联标准术语</div>
                                                    )}
                                                </div>
                                                {!detailCompact && (
                                                    <>
                                                        <div className="pt-2 border-t border-slate-100 space-y-2">
                                                            <div className="text-xs text-slate-500">标签</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {(nodeTags[selectedNode.id] || []).map(tag => (
                                                                    <span key={tag} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px]">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    value={newTag}
                                                                    onChange={(event) => setNewTag(event.target.value)}
                                                                    placeholder="新增标签"
                                                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const trimmed = newTag.trim();
                                                                        if (!trimmed) return;
                                                                        setNodeTags(prev => ({
                                                                            ...prev,
                                                                            [selectedNode.id]: Array.from(new Set([...(prev[selectedNode.id] || []), trimmed]))
                                                                        }));
                                                                        setNewTag('');
                                                                    }}
                                                                    className="px-3 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                                                                >
                                                                    添加
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="pt-2 border-t border-slate-100 space-y-2">
                                                            <div className="text-xs text-slate-500">字段</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {(nodeFields[selectedNode.id] || []).map(field => (
                                                                    <span key={field} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px]">
                                                                        {field}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    value={newField}
                                                                    onChange={(event) => setNewField(event.target.value)}
                                                                    placeholder="新增字段"
                                                                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const trimmed = newField.trim();
                                                                        if (!trimmed) return;
                                                                        setNodeFields(prev => ({
                                                                            ...prev,
                                                                            [selectedNode.id]: Array.from(new Set([...(prev[selectedNode.id] || []), trimmed]))
                                                                        }));
                                                                        setNewField('');
                                                                    }}
                                                                    className="px-3 py-1 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                                                                >
                                                                    添加
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {selectedNodeLinks.length > 0 && (
                                                            <div className="pt-2 border-t border-slate-100">
                                                                <div className="text-xs text-slate-500 mb-2">关联关系</div>
                                                                <div className="space-y-2">
                                                                    {selectedNodeLinks.slice(0, 4).map(edge => {
                                                                        const from = getNode(edge.from);
                                                                        const to = getNode(edge.to);
                                                                        return (
                                                                            <div key={edge.id} className="text-xs text-slate-600 flex items-center justify-between">
                                                                                <span>{from?.label} → {to?.label}</span>
                                                                                <span className="text-slate-400">{edge.label}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {selectedNodeLinks.length > 4 && (
                                                                        <div className="text-[11px] text-slate-400">还有 {selectedNodeLinks.length - 4} 条关系</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        ) : selectedNodeIds.length > 1 ? (
                                            <div className="text-xs text-slate-500">已选择 {selectedNodeIds.length} 个节点，可批量删除。</div>
                                        ) : (
                                            <div className="text-xs text-slate-400">点击画布节点查看详情</div>
                                        )
                                    ) : selectedEdge && selectedEdgeIds.length <= 1 ? (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">关系</span>
                                                <span className="text-slate-800 font-medium">
                                                    {getNode(selectedEdge.from)?.label} → {getNode(selectedEdge.to)?.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">关系名</span>
                                                <span className="text-slate-800">{selectedEdge.label}</span>
                                            </div>
                                            {detailCompact ? (
                                                <div className="flex items-center gap-2 pt-2">
                                                    <button
                                                        onClick={() => handleEditEdge(selectedEdge.id)}
                                                        className="flex-1 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                                                    >
                                                        编辑关系
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEdge(selectedEdge.id)}
                                                        className="flex-1 py-2 rounded-lg border border-red-100 text-xs text-red-600 hover:bg-red-50"
                                                    >
                                                        删除关系
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-500">线条样式</span>
                                                        <select
                                                            value={(edgeStyles[selectedEdge.id]?.style || 'solid')}
                                                            onChange={(event) => {
                                                                const style = event.target.value as 'solid' | 'dashed';
                                                                setEdgeStyles(prev => ({
                                                                    ...prev,
                                                                    [selectedEdge.id]: {
                                                                        style,
                                                                        weight: prev[selectedEdge.id]?.weight || 2,
                                                                        directed: prev[selectedEdge.id]?.directed ?? true
                                                                    }
                                                                }));
                                                            }}
                                                            className="text-xs text-slate-600 border border-slate-200 rounded-md px-2 py-1 bg-white"
                                                        >
                                                            <option value="solid">实线</option>
                                                            <option value="dashed">虚线</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-500">线条粗细</span>
                                                        <input
                                                            type="range"
                                                            min={1}
                                                            max={4}
                                                            value={edgeStyles[selectedEdge.id]?.weight || 2}
                                                            onChange={(event) => {
                                                                const weight = Number(event.target.value);
                                                                setEdgeStyles(prev => ({
                                                                    ...prev,
                                                                    [selectedEdge.id]: {
                                                                        style: prev[selectedEdge.id]?.style || 'solid',
                                                                        weight,
                                                                        directed: prev[selectedEdge.id]?.directed ?? true
                                                                    }
                                                                }));
                                                            }}
                                                            className="w-32"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-slate-500">方向</span>
                                                        <button
                                                            onClick={() => {
                                                                setEdgeStyles(prev => ({
                                                                    ...prev,
                                                                    [selectedEdge.id]: {
                                                                        style: prev[selectedEdge.id]?.style || 'solid',
                                                                        weight: prev[selectedEdge.id]?.weight || 2,
                                                                        directed: !(prev[selectedEdge.id]?.directed ?? true)
                                                                    }
                                                                }));
                                                            }}
                                                            className="px-3 py-1 rounded-full text-xs border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        >
                                                            {(edgeStyles[selectedEdge.id]?.directed ?? true) ? '有向' : '无向'}
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <button
                                                            onClick={() => handleEditEdge(selectedEdge.id)}
                                                            className="flex-1 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                                                        >
                                                            编辑关系
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEdge(selectedEdge.id)}
                                                            className="flex-1 py-2 rounded-lg border border-red-100 text-xs text-red-600 hover:bg-red-50"
                                                        >
                                                            删除关系
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : selectedEdgeIds.length > 1 ? (
                                        <div className="text-xs text-slate-500">已选择 {selectedEdgeIds.length} 条关系，可批量删除。</div>
                                    ) : (
                                        <div className="text-xs text-slate-400">点击画布连线查看详情</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {rightStep === 'search' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setOpenPanels(prev => ({ ...prev, batch: !prev.batch }))}
                                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-700 bg-slate-50"
                                >
                                    批量操作
                                    {openPanels.batch ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {openPanels.batch && (
                                    <div className="p-4 space-y-3 text-sm">
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>已选节点</span>
                                            <span className="text-slate-700">{selectedNodeIds.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>已选关系</span>
                                            <span className="text-slate-700">{selectedEdgeIds.length}</span>
                                        </div>
                                        <button
                                            onClick={handleBatchDelete}
                                            disabled={selectedNodeIds.length === 0 && selectedEdgeIds.length === 0}
                                            className={`w-full py-2 rounded-lg text-xs ${selectedNodeIds.length === 0 && selectedEdgeIds.length === 0
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                                                }`}
                                        >
                                            批量删除
                                        </button>
                                        <div className="text-[11px] text-slate-400">按住 Ctrl/⌘ 可多选，Delete 快捷删除。</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {rightStep === 'search' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-700 bg-slate-50">
                                    检索与建模
                                    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs">
                                        <button
                                            onClick={() => setRightTab('model')}
                                            className={`px-3 py-1 rounded-full ${rightTab === 'model' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            建模
                                        </button>
                                        <button
                                            onClick={() => setRightTab('search')}
                                            className={`px-3 py-1 rounded-full ${rightTab === 'search' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            检索
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3 text-sm">
                                    {rightTab === 'model' ? (
                                        <>
                                            <input
                                                value={newNodeName}
                                                onChange={(event) => setNewNodeName(event.target.value)}
                                                placeholder="新节点名称"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <select
                                                    value={newNodeKind}
                                                    onChange={(event) => {
                                                        const nextKind = event.target.value as 'object' | 'attribute';
                                                        setNewNodeKind(nextKind);
                                                        setNewNodeType(nextKind === 'attribute' ? 'attribute' : 'entity');
                                                    }}
                                                    className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600"
                                                >
                                                    <option value="object">对象</option>
                                                    <option value="attribute">属性</option>
                                                </select>
                                                <select
                                                    value={newNodeType}
                                                    onChange={(event) => setNewNodeType(event.target.value as ObjectType)}
                                                    disabled={newNodeKind === 'attribute'}
                                                    className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-600 disabled:bg-slate-50 disabled:text-slate-400"
                                                >
                                                    {(['entity', 'event', 'rule', 'state'] as ObjectType[]).map(type => (
                                                        <option key={type} value={type}>{OBJECT_TYPE_LABELS[type]}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                onClick={handleAddNode}
                                                className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                                            >
                                                添加节点
                                            </button>
                                            {layoutPresets.length > 0 && (
                                                <div className="pt-2 border-t border-slate-100">
                                                    <div className="text-xs text-slate-500 mb-2">布局方案</div>
                                                    <div className="space-y-2">
                                                        {layoutPresets.map(item => (
                                                            <button
                                                                key={item.id}
                                                                onClick={() => handleApplyLayout(item.id)}
                                                                className={`w-full px-3 py-2 rounded-lg text-xs border ${selectedLayoutId === item.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                            >
                                                                {item.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                value={searchTerm}
                                                onChange={(event) => setSearchTerm(event.target.value)}
                                                placeholder="搜索对象/属性"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    const firstNodeId = Array.from(matchedNodeIds)[0];
                                                    if (!firstNodeId || !canvasRef.current) return;
                                                    setSelectedNodeIds([firstNodeId]);
                                                    setSelectedNodeId(firstNodeId);
                                                    setSelectedEdgeId(null);
                                                    setSelectedEdgeIds([]);
                                                    centerOnNode(firstNodeId);
                                                }}
                                                className="w-full py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                                            >
                                                定位首个命中
                                            </button>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                {(['all', 'entity', 'event', 'rule', 'state', 'attribute'] as const).map(option => (
                                                    <button
                                                        key={option}
                                                        onClick={() => setFilterType(option)}
                                                        className={`py-2 rounded-lg border ${filterType === option ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                    >
                                                        {option === 'all' ? '全部' : OBJECT_TYPE_LABELS[option]}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                当前显示 {filteredNodes.length} 个节点 / {filteredEdges.length} 条关系
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {rightStep === 'relation' && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setOpenPanels(prev => ({ ...prev, relation: !prev.relation }))}
                                    className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-700 bg-blue-600 text-white"
                                >
                                    关系定义
                                    {openPanels.relation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {openPanels.relation && (
                                    <div className="p-4 space-y-4 text-sm">
                                        {selectedEdge && (
                                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                                正在编辑：{getNode(selectedEdge.from)?.label} → {getNode(selectedEdge.to)?.label} / {selectedEdge.label}
                                            </div>
                                        )}
                                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                            <div className="flex items-center justify-between">
                                                <span>步骤引导</span>
                                                <span className="text-slate-400">1/2/3</span>
                                            </div>
                                            <div className="mt-2 grid grid-cols-3 gap-2">
                                                {[
                                                    { key: 'source', label: '选择源对象', ok: Boolean(selectedSource) },
                                                    { key: 'target', label: '选择目标对象', ok: Boolean(selectedTarget) },
                                                    { key: 'name', label: '定义关系', ok: Boolean(relationshipName.trim()) }
                                                ].map(item => (
                                                    <div
                                                        key={item.key}
                                                        className={`rounded-md border px-2 py-1 ${item.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500'}`}
                                                    >
                                                        {item.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
                                                选择源对象
                                            </div>
                                            <select
                                                value={selectedSource}
                                                onChange={(e) => setSelectedSource(e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            >
                                                {objectNodes.map(node => (
                                                    <option key={node.id} value={node.id}>{node.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
                                                选择目标对象
                                            </div>
                                            <select
                                                value={selectedTarget}
                                                onChange={(e) => setSelectedTarget(e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            >
                                                {objectNodes.map(node => (
                                                    <option key={node.id} value={node.id}>{node.label}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => {
                                                    setSelectedSource(selectedTarget);
                                                    setSelectedTarget(selectedSource);
                                                }}
                                                className="mt-2 w-full py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                                            >
                                                交换方向
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">3</span>
                                                定义关系
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {relationshipSuggestions.map(item => (
                                                    <button
                                                        key={item}
                                                        onClick={() => {
                                                            setRelationshipType(RELATIONSHIP_TYPES.includes(item) ? item : '自定义');
                                                            setRelationshipName(item);
                                                        }}
                                                        className="px-2 py-1 rounded-full border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50"
                                                    >
                                                        {item}
                                                    </button>
                                                ))}
                                            </div>
                                            <select
                                                value={relationshipType}
                                                onChange={(event) => {
                                                    const nextType = event.target.value;
                                                    setRelationshipType(nextType);
                                                    if (nextType !== '自定义') {
                                                        setRelationshipName(nextType);
                                                    }
                                                }}
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            >
                                                {RELATIONSHIP_TYPES.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                                <option value="自定义">自定义</option>
                                            </select>
                                            <input
                                                value={relationshipName}
                                                onChange={(e) => setRelationshipName(e.target.value)}
                                                placeholder="输入自定义关系名"
                                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={handleCreateRelationship}
                                            className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                                        >
                                            {editingEdgeId ? '保存关系' : '创建关系连接'}
                                        </button>
                                        <div className="pt-3 border-t border-slate-100">
                                            <div className="text-xs text-slate-500 mb-2">已有关系</div>
                                            <div className="space-y-2">
                                                {edges.filter(edge => getNode(edge.from)?.objectType !== 'attribute' && getNode(edge.to)?.objectType !== 'attribute').map(edge => (
                                                    <div
                                                        key={edge.id}
                                                        onClick={(event) => handleEdgeSelect(event, edge.id)}
                                                        onDoubleClick={() => handleEditEdge(edge.id)}
                                                        className={`flex items-center justify-between text-xs rounded-md px-2 py-1.5 cursor-pointer ${selectedEdgeIds.includes(edge.id) ? 'bg-blue-50 text-blue-700' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'}`}
                                                    >
                                                        <span>{getNode(edge.from)?.label} → {getNode(edge.to)?.label} · {edge.label}</span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleEditEdge(edge.id)}
                                                                className="p-1 rounded hover:bg-white text-slate-500 hover:text-slate-700"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteEdge(edge.id)}
                                                                className="p-1 rounded hover:bg-white text-slate-500 hover:text-red-500"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {rightStep === 'search' && (
                            ([
                                { key: 'api', label: '接口管理' },
                                { key: 'action', label: '动作管理' },
                                { key: 'function', label: '函数管理' }
                            ] as const).map(section => (
                                <div key={section.key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => setOpenPanels(prev => ({ ...prev, [section.key]: !prev[section.key] }))}
                                        className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-700"
                                    >
                                        {section.label}
                                        {openPanels[section.key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    {openPanels[section.key] && (
                                        <div className="px-4 pb-4 text-xs text-slate-500">
                                            暂无配置项，可在关系建立后补充。
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            {termModalOpen && termTargetNodeId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <div>
                                <div className="text-sm font-semibold text-slate-700">标准术语绑定</div>
                                <div className="text-xs text-slate-500 mt-1">双击节点后，可直接关联或创建标准术语。</div>
                            </div>
                            <button
                                onClick={() => setTermModalOpen(false)}
                                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="px-4 py-4 space-y-4">
                            <div>
                                <div className="text-xs text-slate-500 mb-2">关联已有术语</div>
                                <input
                                    value={termSearch}
                                    onChange={(event) => setTermSearch(event.target.value)}
                                    placeholder="搜索标准术语"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                />
                                <div className="mt-3 max-h-40 overflow-auto space-y-2">
                                    {terms.filter(term => {
                                        const match = term.name.toLowerCase().includes(termSearch.toLowerCase());
                                        return !termSearch || match;
                                    }).map(term => (
                                        <button
                                            key={term.id}
                                            onClick={() => handleBindTerm(term.id)}
                                            className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                                        >
                                            <span>{term.name}</span>
                                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${OBJECT_TYPE_STYLES[term.objectType].badge}`}>
                                                {OBJECT_TYPE_LABELS[term.objectType]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t border-slate-100 pt-4 space-y-3">
                                <div className="text-xs text-slate-500">创建新术语</div>
                                <input
                                    value={termName}
                                    onChange={(event) => setTermName(event.target.value)}
                                    placeholder="术语名称"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                />
                                <select
                                    value={termObjectType}
                                    onChange={(event) => setTermObjectType(event.target.value as ObjectType)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                >
                                    {(['entity', 'event', 'rule', 'state', 'attribute'] as ObjectType[]).map(type => (
                                        <option key={type} value={type}>{OBJECT_TYPE_LABELS[type]}</option>
                                    ))}
                                </select>
                                <textarea
                                    value={termDefinition}
                                    onChange={(event) => setTermDefinition(event.target.value)}
                                    rows={2}
                                    placeholder="术语定义（可选）"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                                />
                                <button
                                    onClick={handleCreateTerm}
                                    className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                                >
                                    创建并绑定
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourceKnowledgeNetworkView;
