import { useState, useCallback } from "react";

export interface TableSelectionOptions<T> {
  idField?: keyof T;
  onSelectionChange?: (items: T[] | null, currentItem: T | null) => void;
}

export function useTableSelection<T extends object>(
  options?: TableSelectionOptions<T>,
) {
  const [selectedItems, setSelectedItems] = useState<T[] | null>(null);
  const [currentItem, setCurrentItem] = useState<T | null>(null);

  const idField = options?.idField || ("uuid" as keyof T);

  // Select an item - adds to selection if multiple, replaces if single
  const selectItem = useCallback(
    (item: T, multiple = true) => {
      // Always update current item
      setCurrentItem(item);

      if (multiple) {
        setSelectedItems((prev) => {
          // Check if already selected
          if (prev?.some((i) => i[idField] === item[idField])) {
            return prev;
          }
          // Add to selection
          const newSelection = prev ? [...prev, item] : [item];

          // Call external handler if provided
          if (options?.onSelectionChange) {
            options.onSelectionChange(newSelection, item);
          }

          return newSelection;
        });
      } else {
        // Single selection - just replace
        const newSelection = [item];
        setSelectedItems(newSelection);

        if (options?.onSelectionChange) {
          options.onSelectionChange(newSelection, item);
        }
      }

      return item;
    },
    [idField, options],
  );

  // Deselect an item
  const deselectItem = useCallback(
    (item: T) => {
      setSelectedItems((prev) => {
        if (!prev) return null;

        const newSelection = prev.filter((i) => i[idField] !== item[idField]);

        if (newSelection.length === 0) {
          setCurrentItem(null);
          if (options?.onSelectionChange) {
            options.onSelectionChange(null, null);
          }
          return null;
        }

        if (options?.onSelectionChange) {
          options.onSelectionChange(newSelection, currentItem);
        }

        return newSelection;
      });
    },
    [idField, options, currentItem],
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedItems(null);
    setCurrentItem(null);

    if (options?.onSelectionChange) {
      options.onSelectionChange(null, null);
    }
  }, [options]);

  // Handle table selection changes
  const handleSelectionChange = useCallback(
    (selection: T[] | null) => {
      setSelectedItems(selection);

      if (selection && selection.length > 0) {
        setCurrentItem(selection[selection.length - 1]);
      } else {
        setCurrentItem(null);
      }

      if (options?.onSelectionChange) {
        options.onSelectionChange(
          selection,
          selection && selection.length > 0
            ? selection[selection.length - 1]
            : null,
        );
      }
    },
    [options],
  );

  return {
    selectedItems,
    currentItem,
    selectItem,
    deselectItem,
    clearSelection,
    handleSelectionChange,
  };
}
