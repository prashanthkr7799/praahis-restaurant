import React, { useState, useRef } from 'react';
import { 
  X, 
  Plus, 
  Upload, 
  Clock, 
  IndianRupee,
  Leaf, 
  Drumstick,
  Check,
  Sparkles,
  ChefHat,
  Tag,
  FileText,
  Utensils,
  Flame,
  IceCream,
  Coffee,
  Salad,
  Soup,
  Pizza
} from 'lucide-react';
import { supabase } from '@config/supabase';
import toast from 'react-hot-toast';

const categoryIcons = {
  'Appetizers': Flame,
  'Starters': Flame,
  'Main Course': Utensils,
  'Desserts': IceCream,
  'Beverages': Coffee,
  'Breads': Pizza,
  'Rice': Utensils,
  'Salads': Salad,
  'Soups': Soup,
  'Sides': Tag,
  'Specials': Sparkles,
};

const categories = [
  'Appetizers',
  'Starters', 
  'Main Course',
  'Desserts',
  'Beverages',
  'Breads',
  'Rice',
  'Salads',
  'Soups',
  'Sides',
  'Specials',
];

const AddMenuItemModal = ({ isOpen, onClose, restaurantId, onItemAdded, onAdd }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    customCategory: '',
    price: '',
    preparationTime: '',
    isVegetarian: true,
    isAvailable: true,
    imageUrl: '',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = (restaurantId || 'temp') + '/' + Date.now() + '.' + fileExt;
      const { error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        imageUrl: publicUrl,
      }));

      toast.success('Image uploaded!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalCategory = formData.category === 'custom' ? formData.customCategory : formData.category;

    if (!formData.name || !finalCategory || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      if (restaurantId) {
        const { data: limits, error: limitsError } = await supabase
          .rpc('get_restaurant_limits');

        if (!limitsError && limits && limits.length > 0) {
          const { max_menu_items, current_menu_items } = limits[0];
          if (current_menu_items >= max_menu_items) {
            toast.error('Menu item limit reached! Your plan allows ' + max_menu_items + ' items.');
            setLoading(false);
            return;
          }
        }
      }

      const { data: newItem, error } = await supabase
        .from('menu_items')
        .insert([
          {
            restaurant_id: restaurantId,
            name: formData.name,
            category: finalCategory,
            price: parseFloat(formData.price),
            preparation_time: formData.preparationTime ? parseInt(formData.preparationTime) : null,
            is_vegetarian: formData.isVegetarian,
            is_available: formData.isAvailable,
            image_url: formData.imageUrl || null,
            description: formData.description || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success(formData.name + ' added to menu!');

      setFormData({
        name: '',
        category: '',
        customCategory: '',
        price: '',
        preparationTime: '',
        isVegetarian: true,
        isAvailable: true,
        imageUrl: '',
        description: '',
      });
      setImagePreview(null);

      if (onItemAdded) onItemAdded(newItem);
      if (onAdd) onAdd(newItem);

      onClose();
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error('Failed to add menu item');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl my-2 sm:my-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add New Dish</h2>
              <p className="text-xs text-zinc-400">Create a new menu item</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all text-zinc-400 hover:text-white"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="max-h-[calc(100vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div 
            className={'relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ' + (dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/20 hover:border-white/40')}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div className="relative h-32 group">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-medium hover:bg-white/30 transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="px-3 py-1.5 bg-rose-500/80 backdrop-blur-sm rounded-lg text-white text-xs font-medium hover:bg-rose-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center py-6 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={'w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ' + (dragActive ? 'bg-emerald-500/20 scale-110' : 'bg-white/5')}>
                  {uploadingImage ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-emerald-500 rounded-full animate-spin" />
                  ) : (
                    <Upload className={'h-6 w-6 ' + (dragActive ? 'text-emerald-400' : 'text-zinc-500')} />
                  )}
                </div>
                <p className="text-xs font-medium text-white mb-0.5">
                  {dragActive ? 'Drop image here' : 'Click or drop image'}
                </p>
                <p className="text-xs text-zinc-500">Max 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={uploadingImage}
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-white mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Dish Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Butter Chicken"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-white mb-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Description <span className="text-zinc-500 font-normal">(optional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description..."
                rows="2"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-white mb-2">
              <Tag className="w-3.5 h-3.5 text-violet-400" />
              Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat] || Tag;
                const isSelected = formData.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                    className={'px-2 py-2 rounded-lg text-[10px] font-medium transition-all flex flex-col items-center gap-1 ' + (isSelected ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white')}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="truncate w-full text-center">{cat}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: 'custom' }))}
                className={'px-2 py-2 rounded-lg text-[10px] font-medium transition-all flex flex-col items-center gap-1 ' + (formData.category === 'custom' ? 'bg-violet-500 text-white shadow-lg' : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white')}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom</span>
              </button>
            </div>
            {formData.category === 'custom' && (
              <input
                type="text"
                name="customCategory"
                value={formData.customCategory}
                onChange={handleChange}
                placeholder="Enter custom category"
                className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                Price <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">₹</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="299"
                  min="0"
                  step="1"
                  className="w-full pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-white mb-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Prep Time <span className="text-zinc-500 font-normal">(mins)</span>
              </label>
              <input
                type="number"
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleChange}
                placeholder="15"
                min="0"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isVegetarian: !prev.isVegetarian }))}
              className={'relative p-3 rounded-xl border-2 transition-all ' + (formData.isVegetarian ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10')}
            >
              <div className="flex items-center gap-2">
                <div className={'w-8 h-8 rounded-lg flex items-center justify-center ' + (formData.isVegetarian ? 'bg-emerald-500/20' : 'bg-rose-500/20')}>
                  {formData.isVegetarian 
                    ? <Leaf className="w-4 h-4 text-emerald-400" />
                    : <Drumstick className="w-4 h-4 text-rose-400" />
                  }
                </div>
                <div className="text-left">
                  <p className={'text-xs font-bold ' + (formData.isVegetarian ? 'text-emerald-400' : 'text-rose-400')}>
                    {formData.isVegetarian ? 'Veg' : 'Non-Veg'}
                  </p>
                  <p className="text-[10px] text-zinc-500">Tap to change</p>
                </div>
              </div>
              <div className={'absolute top-2 right-2 w-4 h-4 rounded border-2 flex items-center justify-center ' + (formData.isVegetarian ? 'border-emerald-500' : 'border-rose-500')}>
                <div className={'w-2 h-2 rounded-full ' + (formData.isVegetarian ? 'bg-emerald-500' : 'bg-rose-500')} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, isAvailable: !prev.isAvailable }))}
              className={'relative p-3 rounded-xl border-2 transition-all ' + (formData.isAvailable ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-600 bg-zinc-800/50')}
            >
              <div className="flex items-center gap-2">
                <div className={'w-8 h-8 rounded-lg flex items-center justify-center ' + (formData.isAvailable ? 'bg-blue-500/20' : 'bg-zinc-700')}>
                  {formData.isAvailable 
                    ? <Check className="w-4 h-4 text-blue-400" />
                    : <X className="w-4 h-4 text-zinc-500" />
                  }
                </div>
                <div className="text-left">
                  <p className={'text-xs font-bold ' + (formData.isAvailable ? 'text-blue-400' : 'text-zinc-400')}>
                    {formData.isAvailable ? 'Available' : 'Unavailable'}
                  </p>
                  <p className="text-[10px] text-zinc-500">Tap to change</p>
                </div>
              </div>
            </button>
          </div>

          <div className="flex gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg font-medium text-white text-sm transition-all border border-white/10"
              disabled={loading || uploadingImage}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg font-bold text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  <span>Add to Menu</span>
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AddMenuItemModal;
