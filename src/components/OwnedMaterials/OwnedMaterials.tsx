// src/components/OwnedMaterials/OwnedMaterials.tsx
import React, { useState, useCallback } from 'react';
import './OwnedMaterials.css';
import { useOwnedMaterialsStore } from '../../store/useOwnedMaterialsStore';
import { toast } from 'react-hot-toast';
import { FaTrash } from 'react-icons/fa'; // Import the trash icon

const OwnedMaterials: React.FC = () => {
  const {
    ownedMaterials,
    addOwnedMaterial,
    updateOwnedMaterial,
    removeOwnedMaterial,
  } = useOwnedMaterialsStore();

  const [newOwnedMaterialName, setNewOwnedMaterialName] = useState<string>('');
  const [newOwnedMaterialQuantity, setNewOwnedMaterialQuantity] =
    useState<string>('');

  const handleAddOwnedMaterial = useCallback(() => {
    const quantity = Number(newOwnedMaterialQuantity);
    if (newOwnedMaterialName.trim() && !isNaN(quantity) && quantity >= 0) {
      addOwnedMaterial({
        itemName: newOwnedMaterialName.trim(),
        quantity: quantity,
      });
      setNewOwnedMaterialName('');
      setNewOwnedMaterialQuantity('');
      toast.success(
        `Added ${quantity} x ${newOwnedMaterialName} to owned materials.`,
      );
    } else {
      toast.error('Please enter a valid material name and quantity.');
    }
  }, [newOwnedMaterialName, newOwnedMaterialQuantity, addOwnedMaterial]);

  const handleUpdateOwnedMaterialQuantity = useCallback(
    (itemName: string, value: string) => {
      const parsedQuantity = Number(value);
      const quantityToStore =
        isNaN(parsedQuantity) || parsedQuantity < 0 ? 0 : parsedQuantity;
      updateOwnedMaterial(itemName, quantityToStore);
      if (quantityToStore > 0) {
        toast.success(`Updated ${itemName} quantity to ${quantityToStore}.`);
      } else if (value.trim() === '0') {
        toast.success(`Set ${itemName} quantity to 0.`);
      }
    },
    [updateOwnedMaterial],
  );

  const handleRemoveOwnedMaterial = useCallback(
    (itemName: string) => {
      removeOwnedMaterial(itemName);
      toast.success(`Removed ${itemName} from owned materials.`);
    },
    [removeOwnedMaterial],
  );

  return (
    <div className='owned-materials-section card'>
      <h3>Materials on Hand</h3>
      <div className='add-material-form'>
        <input
          type='text'
          placeholder='Material Name'
          value={newOwnedMaterialName}
          onChange={(e) => setNewOwnedMaterialName(e.target.value)}
        />
        <input
          type='number'
          placeholder='Quantity'
          value={newOwnedMaterialQuantity}
          onChange={(e) => setNewOwnedMaterialQuantity(e.target.value)}
          min='0'
        />
        <button onClick={handleAddOwnedMaterial}>Add Material</button>
      </div>

      {ownedMaterials.length > 0 && (
        <ul className='owned-materials-list scrollbar-custom'>
          {ownedMaterials.map((material) => (
            <li key={material.itemName} className='owned-material-item'>
              <span>
                {material.itemName} (x{material.quantity})
              </span>
              <div className='material-actions'>
                <input
                  type='number'
                  value={
                    material.quantity === 0 ? '' : material.quantity.toString()
                  }
                  onChange={(e) =>
                    handleUpdateOwnedMaterialQuantity(
                      material.itemName,
                      e.target.value,
                    )
                  }
                  min='0'
                />
                <button
                  onClick={() => handleRemoveOwnedMaterial(material.itemName)}
                  className='remove-material-btn'
                  aria-label='Remove material'
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {ownedMaterials.length === 0 && (
        <p>No materials on hand. Add some above!</p>
      )}
    </div>
  );
};

export default OwnedMaterials;
