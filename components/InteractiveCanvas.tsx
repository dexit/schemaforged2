

import React from 'react';
import ReactFlow, { Controls, Background, MiniMap, Edge } from 'reactflow';
import TableNode from './nodes/TableNode';

interface InteractiveCanvasProps {
  nodes: any[];
  edges: any[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onNodeContextMenu: (event: any, node: any) => void;
  onPaneClick: () => void;
  onConnect: (params: any) => void;
  isLoading: boolean;
  error: string | null;
  onEdgeMouseEnter: (event: React.MouseEvent, edge: Edge) => void;
  onEdgeMouseLeave: (event: React.MouseEvent, edge: Edge) => void;
}

const nodeTypes = {
  table: TableNode,
};

const EmptyState: React.FC<{message: string; subMessage: string}> = ({ message, subMessage }) => (
    <div className="text-center text-brand-text-secondary p-4">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto h-12 w-12 text-gray-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5l.415-.207a.75.75 0 011.085.67V10.5m0 0h6m-6 0a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75V8.25a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75v2.25m0 0l3.181 3.182m0-3.182l-3.181 3.182m0 0l3.181-3.182m-3.181 3.182L12 15.75M3 13.5a.75.75 0 110-1.5.75.75 0 010 1.5zm0-5.25a.75.75 0 110-1.5.75.75 0 010 1.5zM21 8.25a.75.75 0 110-1.5.75.75 0 010 1.5zm0 5.25a.75.75 0 110-1.5.75.75 0 010 1.5z" />
      </svg>
      <h3 className="mt-2 text-sm font-semibold text-brand-text-primary">{message}</h3>
      <p className="mt-1 text-sm text-brand-text-secondary">{subMessage}</p>
    </div>
);

const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  nodes, edges, onNodesChange, onEdgesChange,
  isLoading, error, onNodeContextMenu, onPaneClick, onConnect,
  onEdgeMouseEnter, onEdgeMouseLeave
}) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <EmptyState message="Generating schema with Gemini..." subMessage="Please wait while the AI crafts your design." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-400 bg-red-900/20 p-6 rounded-lg max-w-md">
            <h3 className="font-bold mb-2">Error Generating Schema</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      );
    }
    
    if (nodes.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <EmptyState message="Schema is Empty" subMessage="Use the controls on the left to generate a new database schema." />
        </div>
      );
    }

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={onPaneClick}
            onConnect={onConnect}
            onEdgeMouseEnter={onEdgeMouseEnter}
            onEdgeMouseLeave={onEdgeMouseLeave}
            fitView
            className="bg-transparent"
            proOptions={{ hideAttribution: true }}
            nodeOrigin={[0.5, 0.5]}
        >
            <Controls />
            <Background color="#444444" gap={16} />
            <MiniMap nodeColor={(n) => n.style?.backgroundColor || '#333'} nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
    );
  };
  
  return (
    <div className="flex-grow bg-gray-900/50 border border-brand-border rounded-lg overflow-hidden h-full">
      {renderContent()}
    </div>
  );
};

export default InteractiveCanvas;
