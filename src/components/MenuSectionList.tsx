import React, { useState, useCallback, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MenuSection } from '../services/menuService';

// Type for the draggable section item
type DraggableSectionProps = {
  section: MenuSection;
  index: number;
  moveSection: (dragIndex: number, hoverIndex: number) => void;
  onSectionClick: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  activeSection: string | null;
  onEditDescription: (sectionId: string, description: string) => void;
  'data-cy'?: string;
};

// Type for the section list props
type MenuSectionListProps = {
  sections: MenuSection[];
  onSectionOrderChange: (sectionIds: string[]) => void;
  onSectionClick: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  activeSection: string | null;
  onEditDescription: (sectionId: string, description: string) => void;
  'data-cy'?: string;
};

// Type for the drag item
interface DragItem {
  index: number;
  id: string;
  type: string;
}

// Draggable section component
const DraggableSection: React.FC<DraggableSectionProps> = ({
  section,
  index,
  moveSection,
  onSectionClick,
  onDeleteSection,
  activeSection,
  onEditDescription,
  'data-cy': dataCy
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(section.description || '');
  
  // Reference for the drag/drop
  const ref = React.useRef<HTMLLIElement>(null);
  
  // Drop functionality
  const [, drop] = useDrop<DragItem>({
    accept: 'section',
    hover: (item, monitor) => {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      moveSection(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });
  
  // Drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'section',
    item: () => {
      return { id: section._id, index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  // Connect drag and drop refs
  drag(drop(ref));
  
  const handleEditClick = () => {
    setIsEditing(true);
  };
  
  const handleSaveDescription = () => {
    onEditDescription(section._id!, description);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setDescription(section.description || '');
    setIsEditing(false);
  };
  
  return (
    <li 
      ref={ref}
      className={`flex flex-col border rounded-lg mb-2 ${
        isDragging ? 'opacity-50 bg-gray-100' : 'bg-white'
      }`}
    >
      <div className="flex justify-between items-center p-3">
        <button
          onClick={() => onSectionClick(section._id!)}
          className={`flex-1 text-left py-2 px-4 rounded flex items-center ${
            activeSection === section._id
              ? 'bg-blue-100 text-blue-800'
              : 'hover:bg-gray-100'
          }`}
        >
          <div className="mr-2 cursor-move">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <span>{section.name}</span>
        </button>
        <div className="flex items-center">
          <button
            onClick={handleEditClick}
            className="ml-2 text-blue-600 hover:text-blue-800"
            title="Edit description"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => onDeleteSection(section._id!)}
            className="ml-2 text-red-600 hover:text-red-800"
            title="Delete section"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Description section */}
      {isEditing ? (
        <div className="px-4 pb-3">
          <textarea
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Enter section description"
          />
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDescription}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        section.description && (
          <div className="px-4 pb-3 text-sm text-gray-600">
            {section.description}
          </div>
        )
      )}
    </li>
  );
};

// Main menu section list component
const MenuSectionList: React.FC<MenuSectionListProps> = ({
  sections,
  onSectionOrderChange,
  onSectionClick,
  onDeleteSection,
  activeSection,
  onEditDescription,
  'data-cy': dataCy
}) => {
  const [sectionList, setSectionList] = useState<MenuSection[]>(sections);
  
  // Update local state when props change
  useEffect(() => {
    setSectionList(sections);
  }, [sections]);
  
  // Handle moving a section
  const moveSection = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const draggedSection = sectionList[dragIndex];
      
      // Create new array with reordered sections
      const newSections = [...sectionList];
      newSections.splice(dragIndex, 1);
      newSections.splice(hoverIndex, 0, draggedSection);
      
      // Update local state
      setSectionList(newSections);
      
      // Notify parent component about the change
      onSectionOrderChange(newSections.map(section => section._id!));
    },
    [sectionList, onSectionOrderChange]
  );
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white rounded-lg shadow-md p-4" data-cy={dataCy}>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Menu Sections</h2>
        
        {sectionList.length === 0 ? (
          <div className="text-center text-sm text-gray-600">
            No sections available
          </div>
        ) : (
          <ul className="space-y-2">
            {sectionList.map((section, index) => (
              <DraggableSection
                key={section._id}
                index={index}
                section={section}
                moveSection={moveSection}
                onSectionClick={onSectionClick}
                onDeleteSection={onDeleteSection}
                activeSection={activeSection}
                onEditDescription={onEditDescription}
              />
            ))}
          </ul>
        )}
      </div>
    </DndProvider>
  );
};

export default MenuSectionList; 