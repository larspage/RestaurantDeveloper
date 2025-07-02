import React, { useState } from 'react';
import { Order, OrderStatus } from '../services/orderService';
import StatusUpdateModal from './StatusUpdateModal';

interface BulkOrderActionsProps {
  selectedOrders: Order[];
  onStatusUpdate: (orderIds: string[], newStatus: OrderStatus, estimatedTime?: string, reason?: string) => Promise<void>;
  onClearSelection: () => void;
  isUpdating?: boolean;
}

const BulkOrderActions: React.FC<BulkOrderActionsProps> = ({
  selectedOrders,
  onStatusUpdate,
  onClearSelection,
  isUpdating = false
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  const getAvailableActions = () => {
    if (selectedOrders.length === 0) return [];

    // Find common actions available for all selected orders
    const allStatuses = selectedOrders.map(order => order.status as OrderStatus);
    const uniqueStatuses = [...new Set(allStatuses)];

    const actions: { status: OrderStatus; label: string; color: string }[] = [];

    // If all orders are in the same status, show next step
    if (uniqueStatuses.length === 1) {
      const currentStatus = uniqueStatuses[0];
      switch (currentStatus) {
        case 'received':
          actions.push({ status: 'confirmed', label: 'Confirm All', color: 'bg-yellow-600 hover:bg-yellow-700' });
          break;
        case 'confirmed':
          actions.push({ status: 'in_kitchen', label: 'Start Preparing All', color: 'bg-orange-600 hover:bg-orange-700' });
          break;
        case 'in_kitchen':
          actions.push({ status: 'ready_for_pickup', label: 'Mark All Ready', color: 'bg-green-600 hover:bg-green-700' });
          break;
        case 'ready_for_pickup':
          actions.push({ status: 'delivered', label: 'Complete All', color: 'bg-blue-600 hover:bg-blue-700' });
          break;
      }
    }

    // Always show cancel option for orders that can be cancelled
    const cancellableOrders = selectedOrders.filter(order => 
      ['received', 'confirmed'].includes(order.status)
    );
    if (cancellableOrders.length > 0) {
      actions.push({ 
        status: 'cancelled', 
        label: `Cancel ${cancellableOrders.length} Order${cancellableOrders.length !== 1 ? 's' : ''}`, 
        color: 'bg-red-600 hover:bg-red-700' 
      });
    }

    return actions;
  };

  const handleStatusClick = (status: OrderStatus) => {
    setPendingStatus(status);
    setShowStatusModal(true);
  };

  const handleModalConfirm = async (estimatedTime?: string, reason?: string) => {
    if (!pendingStatus) return;

    const orderIds = pendingStatus === 'cancelled' 
      ? selectedOrders.filter(order => ['received', 'confirmed'].includes(order.status)).map(order => order._id)
      : selectedOrders.map(order => order._id);

    try {
      await onStatusUpdate(orderIds, pendingStatus, estimatedTime, reason);
      setShowStatusModal(false);
      setPendingStatus(null);
      onClearSelection();
    } catch (error) {
      // Error handling is done in parent component
      setShowStatusModal(false);
      setPendingStatus(null);
    }
  };

  const handleModalClose = () => {
    setShowStatusModal(false);
    setPendingStatus(null);
  };

  const getOrderSummary = () => {
    const statusCounts = selectedOrders.reduce((acc, order) => {
      const status = order.status as OrderStatus;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    return Object.entries(statusCounts).map(([status, count]) => 
      `${count} ${status.replace('_', ' ')}`
    ).join(', ');
  };

  const availableActions = getAvailableActions();

  if (selectedOrders.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Selection Summary */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">{selectedOrders.length}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-gray-600">{getOrderSummary()}</p>
              </div>
            </div>
            
            <button
              onClick={onClearSelection}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap gap-2">
            {availableActions.length > 0 ? (
              availableActions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => handleStatusClick(action.status)}
                  disabled={isUpdating}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 ${action.color}`}
                >
                  {action.label}
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">
                No bulk actions available for selected orders
              </p>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        {isUpdating && (
          <div className="mt-4 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">Updating orders...</span>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && pendingStatus && (
        <StatusUpdateModal
          isOpen={showStatusModal}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          currentStatus={selectedOrders[0]?.status as OrderStatus}
          newStatus={pendingStatus}
          orderNumber={selectedOrders.length === 1 
            ? selectedOrders[0]._id.slice(-8).toUpperCase()
            : `${selectedOrders.length} orders`
          }
          isLoading={isUpdating}
        />
      )}
    </>
  );
};

export default BulkOrderActions; 