'use client'
44
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Save, Eye } from 'lucide-react'
import { useInvoiceStore } from '@/lib/store'
import { InvoiceItem } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ItemRow } from './item-row'
import { BottomSheet } from './bottom-sheet'

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.string(),
  dueDate: z.string(),
  customerName: z.string().min(3, 'Customer name must be at least 3 characters'),
  customerAddress: z.string().optional(),
  shippingCost: z.number().min(0),
})

const itemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be positive'),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>
type ItemFormData = z.infer<typeof itemSchema>

interface InvoiceFormMobileProps {
  onPreview: () => void
}

export function InvoiceFormMobile({ onPreview }: InvoiceFormMobileProps) {
  const {
    currentInvoice,
    updateCurrentInvoice,
    addInvoiceItem,
    updateInvoiceItem,
    removeInvoiceItem,
    saveDraft,
    calculateTotals,
    initializeNewInvoice
  } = useInvoiceStore()

  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null)

  // Initialize invoice if not exists
  useEffect(() => {
    if (!currentInvoice) {
      initializeNewInvoice()
    }
  }, [currentInvoice, initializeNewInvoice])

  // Main form
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: currentInvoice?.invoiceNumber || '',
      invoiceDate: currentInvoice?.invoiceDate ? new Date(currentInvoice.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: currentInvoice?.dueDate ? new Date(currentInvoice.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: currentInvoice?.customer?.name || '',
      customerAddress: currentInvoice?.customer?.address || '',
      shippingCost: currentInvoice?.shippingCost || 0,
    },
  })

  // Item form
  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      description: '',
      quantity: 1,
      price: 0,
    },
  })

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentInvoice) {
        saveDraft()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [currentInvoice, saveDraft])

  const handleFormChange = (field: keyof InvoiceFormData, value: any) => {
    if (field === 'customerName' || field === 'customerAddress') {
      updateCurrentInvoice({
        customer: {
          ...currentInvoice?.customer,
          name: field === 'customerName' ? value : currentInvoice?.customer?.name || '',
          email: '', // Email removed
          address: field === 'customerAddress' ? value : currentInvoice?.customer?.address,
        }
      })
    } else if (field === 'invoiceDate' || field === 'dueDate') {
      updateCurrentInvoice({
        [field]: new Date(value)
      })
    } else {
      updateCurrentInvoice({
        [field]: value
      })
    }
  }

  const handleAddItem = (data: ItemFormData) => {
    if (editingItem) {
      updateInvoiceItem(editingItem.id, data)
    } else {
      addInvoiceItem(data)
    }
    calculateTotals()
    itemForm.reset()
    setEditingItem(null)
    setShowItemModal(false)
  }

  const handleEditItem = (item: InvoiceItem) => {
    setEditingItem(item)
    itemForm.setValue('description', item.description)
    itemForm.setValue('quantity', item.quantity)
    itemForm.setValue('price', item.price)
    setShowItemModal(true)
  }

  const handleDeleteItem = (id: string) => {
    if (confirm('Delete this item?')) {
      removeInvoiceItem(id)
      calculateTotals()
    }
  }

  const handleSaveDraft = () => {
    saveDraft()
    alert('Draft saved!')
  }

  if (!currentInvoice) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Invoice Number Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="space-y-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                {...form.register('invoiceNumber')}
                onChange={(e) => handleFormChange('invoiceNumber', e.target.value)}
                className="text-lg font-semibold"
              />
              {form.formState.errors.invoiceNumber && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.invoiceNumber.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  {...form.register('invoiceDate')}
                  onChange={(e) => handleFormChange('invoiceDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...form.register('dueDate')}
                  onChange={(e) => handleFormChange('dueDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Customer Information</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                {...form.register('customerName')}
                onChange={(e) => handleFormChange('customerName', e.target.value)}
                placeholder="Enter customer name"
              />
              {form.formState.errors.customerName && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.customerName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customerAddress">Address (Optional)</Label>
              <Textarea
                id="customerAddress"
                {...form.register('customerAddress')}
                onChange={(e) => handleFormChange('customerAddress', e.target.value)}
                placeholder="Enter customer address"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Items</h3>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingItem(null)
                itemForm.reset()
                setShowItemModal(true)
              }}
              className="gap-2"
            >
              <Plus size={18} />
              Add Item
            </Button>
          </div>

          {currentInvoice.items && currentInvoice.items.length > 0 ? (
            <div className="space-y-3">
              {currentInvoice.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No items added yet. Tap "Add Item" to get started.
            </p>
          )}
        </div>

        {/* Totals Section */}
        {currentInvoice.items && currentInvoice.items.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(currentInvoice.subtotal || 0)}</span>
              </div>

              <div className="flex justify-between items-center text-base">
                <span className="text-gray-600">Ongkos Kirim</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  {...form.register('shippingCost', { valueAsNumber: true })}
                  onChange={(e) => {
                    handleFormChange('shippingCost', parseFloat(e.target.value) || 0)
                    calculateTotals()
                  }}
                  className="w-32 h-8 text-sm text-right"
                  placeholder="0"
                />
              </div>

              <div className="border-t pt-3 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(currentInvoice.total || 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Actions - Green Zone */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            className="flex-1 gap-2"
            size="lg"
          >
            <Save size={20} />
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={onPreview}
            disabled={!currentInvoice.items || currentInvoice.items.length === 0}
            className="flex-1 gap-2"
            size="lg"
          >
            <Eye size={20} />
            Preview
          </Button>
        </div>
      </div>

      {/* Item Modal */}
      <BottomSheet
        isOpen={showItemModal}
        onClose={() => {
          setShowItemModal(false)
          setEditingItem(null)
          itemForm.reset()
        }}
        title={editingItem ? 'Edit Item' : 'Add Item'}
      >
        <form onSubmit={itemForm.handleSubmit(handleAddItem)} className="p-4 space-y-4">
          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              {...itemForm.register('description')}
              placeholder="Item description"
              autoFocus
            />
            {itemForm.formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">{itemForm.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                {...itemForm.register('quantity', { valueAsNumber: true })}
                min="1"
              />
              {itemForm.formState.errors.quantity && (
                <p className="text-sm text-red-500 mt-1">{itemForm.formState.errors.quantity.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                {...itemForm.register('price', { valueAsNumber: true })}
                min="0"
                step="0.01"
              />
              {itemForm.formState.errors.price && (
                <p className="text-sm text-red-500 mt-1">{itemForm.formState.errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowItemModal(false)
                setEditingItem(null)
                itemForm.reset()
              }}
              className="flex-1"
              size="lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              size="lg"
            >
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  )
}