import React from 'react';

interface ImportPreviewProps {
  isOpen: boolean;
  menuData: any;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ImportPreview: React.FC<ImportPreviewProps> = ({
  isOpen,
  menuData,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  if (!isOpen || !menuData) return null;

  const totalSections = menuData.sections.length;
  const totalItems = menuData.sections.reduce((total: number, section: any) => total + section.items.length, 0);
  const itemsWithPricePoints = menuData.sections.reduce(
    (total: number, section: any) => total + section.items.filter((item: any) => item.pricePoints && item.pricePoints.length > 0).length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Import Preview
                </h3>
                <p className="text-sm text-gray-500">
                  Review the menu data before importing
                </p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-3">{menuData.name}</h4>
              {menuData.description && (
                <p className="text-gray-600 mb-3">{menuData.description}</p>
              )}
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{totalSections}</div>
                  <div className="text-sm text-gray-500">Sections</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{totalItems}</div>
                  <div className="text-sm text-gray-500">Items</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">{itemsWithPricePoints}</div>
                  <div className="text-sm text-gray-500">With Price Points</div>
                </div>
              </div>
            </div>

            {/* Sections Preview */}
            <div className="max-h-96 overflow-y-auto">
              <h4 className="text-md font-medium text-gray-900 mb-3">Menu Contents</h4>
              
              {menuData.sections.map((section: any, sectionIndex: number) => (
                <div key={sectionIndex} className="mb-6 border border-gray-200 rounded-lg">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                    <h5 className="font-medium text-gray-900">{section.name}</h5>
                    {section.description && (
                      <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {section.items.length} item{section.items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="px-4 py-3">
                    <div className="space-y-3">
                      {section.items.map((item: any, itemIndex: number) => (
                        <div key={itemIndex} className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h6 className="font-medium text-gray-900">{item.name}</h6>
                              {item.available === false && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  Unavailable
                                </span>
                              )}
                              {item.category && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            
                            {/* Price Points Display */}
                            {item.pricePoints && item.pricePoints.length > 0 ? (
                              <div className="mt-2">
                                <div className="text-sm font-medium text-gray-700">Price Points:</div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {item.pricePoints.map((pp: any, ppIndex: number) => (
                                    <span
                                      key={ppIndex}
                                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        pp.isDefault 
                                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {pp.name}: ${pp.price.toFixed(2)}
                                      {pp.isDefault && <span className="ml-1 text-blue-600">★</span>}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-gray-900">
                                  ${item.price.toFixed(2)}
                                </span>
                              </div>
                            )}
                            
                            {/* Additional Fields */}
                            {(item.modifications && item.modifications.length > 0) && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">
                                  Modifications: {item.modifications.join(', ')}
                                </span>
                              </div>
                            )}
                            
                            {(item.customizations && item.customizations.length > 0) && (
                              <div className="mt-1">
                                <span className="text-xs text-gray-500">
                                  Customizations: {item.customizations.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </>
              ) : (
                'Confirm Import'
              )}
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPreview; 