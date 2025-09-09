"use client";
import React, { useState } from 'react';
import ModernButton, { ButtonGroup, FloatingButton } from '../../components/ModernButton';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Plus, 
  Trash2, 
  Edit, 
  Download,
  Star,
  Bell,
  Settings
} from 'lucide-react';

const ButtonShowcase = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = (message) => {
    console.log(message);
  };

  const handleLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Modern Button Design System</h1>
          <p className="text-slate-300 text-lg">A comprehensive collection of beautiful, accessible buttons</p>
        </div>

        {/* Basic Button Variants */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Basic Button Variants</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ModernButton variant="primary">Primary</ModernButton>
            <ModernButton variant="secondary">Secondary</ModernButton>
            <ModernButton variant="success">Success</ModernButton>
            <ModernButton variant="danger">Danger</ModernButton>
            <ModernButton variant="warning">Warning</ModernButton>
            <ModernButton variant="info">Info</ModernButton>
          </div>
        </section>

        {/* Outline Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Outline Buttons</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ModernButton variant="primary" outline>Primary</ModernButton>
            <ModernButton variant="success" outline>Success</ModernButton>
            <ModernButton variant="danger" outline>Danger</ModernButton>
            <ModernButton variant="warning" outline>Warning</ModernButton>
            <ModernButton variant="info" outline>Info</ModernButton>
            <ModernButton variant="secondary" outline>Secondary</ModernButton>
          </div>
        </section>

        {/* Button Sizes */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Button Sizes</h2>
          <div className="flex flex-wrap items-center gap-4">
            <ModernButton variant="primary" size="small">Small</ModernButton>
            <ModernButton variant="primary" size="medium">Medium</ModernButton>
            <ModernButton variant="primary" size="large">Large</ModernButton>
            <ModernButton variant="primary" size="xlarge">X-Large</ModernButton>
          </div>
        </section>

        {/* Buttons with Icons */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Buttons with Icons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernButton variant="success" >
              Add to Cart
            </ModernButton>
            <ModernButton variant="danger" icon={<Heart size={16} />}>
              Like
            </ModernButton>
            <ModernButton variant="info" icon={<Share2 size={16} />}>
              Share
            </ModernButton>
            <ModernButton variant="warning" icon={<Star size={16} />}>
              Rate
            </ModernButton>
          </div>
        </section>

        {/* Icon Only Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Icon Only Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <ModernButton variant="primary" icon={<Plus size={20} />} iconOnly />
            <ModernButton variant="success" icon={<Edit size={20} />} iconOnly />
            <ModernButton variant="danger" icon={<Trash2 size={20} />} iconOnly />
            <ModernButton variant="info" icon={<Download size={20} />} iconOnly />
            <ModernButton variant="warning" icon={<Bell size={20} />} iconOnly />
            <ModernButton variant="secondary" icon={<Settings size={20} />} iconOnly />
          </div>
        </section>

        {/* Button States */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Button States</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ModernButton variant="primary" disabled>
              Disabled
            </ModernButton>
            <ModernButton variant="success" loading>
              Loading...
            </ModernButton>
            <ModernButton variant="primary" onClick={handleLoading}>
              {loading ? 'Loading...' : 'Click to Load'}
            </ModernButton>
          </div>
        </section>

        {/* Button Groups */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Button Groups</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg text-slate-300 mb-3">Horizontal Group</h3>
              <ButtonGroup>
                <ModernButton variant="primary">Save</ModernButton>
                <ModernButton variant="secondary">Cancel</ModernButton>
                <ModernButton variant="danger">Delete</ModernButton>
              </ButtonGroup>
            </div>
            
            <div>
              <h3 className="text-lg text-slate-300 mb-3">Vertical Group</h3>
              <ButtonGroup vertical>
                <ModernButton variant="primary">Option 1</ModernButton>
                <ModernButton variant="secondary">Option 2</ModernButton>
                <ModernButton variant="success">Option 3</ModernButton>
              </ButtonGroup>
            </div>
          </div>
        </section>

        {/* Special Effects */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Special Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ModernButton variant="primary" className="glow">Glow Effect</ModernButton>
            <ModernButton variant="info" className="neon">Neon Effect</ModernButton>
            <ModernButton variant="success" className="pulse">Pulse Effect</ModernButton>
          </div>
        </section>

        {/* E-commerce Specific Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">E-commerce Buttons</h2>
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-8 rounded-2xl border border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ModernButton variant="primary" size="large" >
                Add to Cart
              </ModernButton>
              <ModernButton variant="danger" size="large">
                Buy Now
              </ModernButton>
              <ModernButton variant="success" size="large">
                Share
              </ModernButton>
            </div>
          </div>
        </section>

        {/* Interactive Demo */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Interactive Demo</h2>
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-8 rounded-2xl border border-slate-600">
            <div className="text-center mb-6">
              <p className="text-slate-300 mb-4">Click the buttons below to see different interactions</p>
              <div className="flex flex-wrap justify-center gap-4">
                <ModernButton 
                  variant="primary" 
                  onClick={() => handleClick('Primary button clicked!')}
                >
                  Click Me
                </ModernButton>
                <ModernButton 
                  variant="success" 
                  onClick={() => handleClick('Success button clicked!')}
                >
                  Success
                </ModernButton>
                <ModernButton 
                  variant="danger" 
                  onClick={() => handleClick('Danger button clicked!')}
                >
                  Danger
                </ModernButton>
              </div>
            </div>
          </div>
        </section>

        {/* Floating Action Button */}
        <FloatingButton onClick={() => handleClick('Floating button clicked!')}>
          <Plus size={24} />
        </FloatingButton>
      </div>
    </div>
  );
};

export default ButtonShowcase;
