// Main Module for Create Page

import { initializeProductCustomization, browserSupport } from './productCustomization.js';
import { initializeDesignSelection, initializeUploadDesign } from './designManager.js';
import { initializeTextCustomization } from './textCustomization.js';

// Initialize all modules when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check browser support
    if (!browserSupport.modelViewer) {
        console.warn('Model viewer is not supported in this browser');
        // Add fallback or warning message
    }

    // Get main elements
    const gltfViewer = document.getElementById('gltf-viewer');
    const productTypeSelect = document.getElementById('product-type');
    const customizationControls = document.querySelector('.control-group');
    const options = document.querySelectorAll('.option');
    const customizationSections = document.querySelectorAll('.customization_section');
    
    // Get action buttons
    const undoButton = document.getElementById('undo-button');
    const redoButton = document.getElementById('redo-button');
    const saveDesignButton = document.getElementById('save-design-button');
    const addToCartButton = document.getElementById('add-to-cart-button');
    const resetButton = document.getElementById('reset-button');

    // Initialize product customization
    initializeProductCustomization(gltfViewer, productTypeSelect, customizationControls);

    // Initialize design selection and upload
    initializeDesignSelection();
    initializeUploadDesign();

    // Initialize text customization
    initializeTextCustomization();

    // Handle option clicks for showing/hiding sections
    options.forEach(option => {
        option.addEventListener('click', () => {
            const functionality = option.dataset.functionality;
            // Hide welcome message
            const customizationWelcome = document.querySelector('.customization-welcome');
            if (customizationWelcome) {
                customizationWelcome.classList.add('hidden');
            }
            customizationSections.forEach(section => {
                if (section.id === functionality) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
        });
    });
    
    // Handle action buttons
    if (undoButton) {
        undoButton.addEventListener('click', () => {
            console.log('Undo action');
            // Implement undo functionality
            
        });
    }
    
    if (redoButton) {
        redoButton.addEventListener('click', () => {
            console.log('Redo action');
            // Implement redo functionality
        });
    }
    
    if (saveDesignButton) {
        saveDesignButton.addEventListener('click', () => {
            console.log('Save design');
            // Implement save design functionality
        });
    }
    
    if (addToCartButton) {
        addToCartButton.addEventListener('click', () => {
            console.log('Add to cart');
            // Implement add to cart functionality
        });
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            console.log('Reset design');
            // Implement reset functionality
            if (confirm('Are you sure you want to reset your design? All changes will be lost.')) {
                // Reset design logic here
                location.reload(); // Simple reset by reloading the page
            }
        });
    }
});