import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  DrawerRef,
  LUIButton,
  LUICheckbox,
  LUICol,
  LUIFlex,
  LUIIcon,
  LUINumberInput,
  LUIRow,
  LUISelect,
  LUITable,
  LUITableCell,
  LUITextarea,
  LUITextInput,
  LUIToggle,
  useLUINotification,
  type TableColumn,
} from '@/components'
import { getErrorMessage } from '../../setup/shared'
import { useDropdown } from '@/services/dropdown.service'
import { useCreateProducts, useUpdateProducts } from '../products.query'
import type { IProducts } from '../products.types'

/* Numeric inputs are native text fields — coerce so their string values parse to numbers. */
const bonusInfoSchema = z.object({
  id: z.number().optional(),
  min_quantity: z.coerce.number<number>(),
  bonus_quantity: z.coerce.number<number>(),
})

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  code: z.string(),
  barcode: z.string(),
  remarks: z.string(),
  cost_price: z.coerce.number<number>(),
  selling_price: z.coerce.number<number>(),
  mrp: z.coerce.number<number>(),
  max_stock: z.coerce.number<number>(),
  min_stock: z.coerce.number<number>(),
  valuation_method: z.string(),
  has_expiry_date: z.boolean(),
  has_manufacturing_date: z.boolean(),
  category_id: z.number(),
  unit_id: z.number(),
  packing_id: z.number(),
  tax_type_id: z.number(),
  bonus_infos: z.array(bonusInfoSchema),
  purchasable: z.boolean(),
  sellable: z.boolean(),
  service_item: z.boolean(),
  is_batch_available: z.boolean(),
  is_active: z.boolean(),
})

type ProductsFormValues = z.infer<typeof productSchema>

const emptyProductValues: ProductsFormValues = {
  name: '',
  code: '',
  barcode: '',
  remarks: '',
  cost_price: 0,
  selling_price: 0,
  mrp: 0,
  max_stock: 0,
  min_stock: 0,
  valuation_method: '',
  has_expiry_date: false,
  has_manufacturing_date: false,
  category_id: 0,
  unit_id: 0,
  packing_id: 0,
  tax_type_id: 0,
  bonus_infos: [],
  purchasable: true,
  sellable: true,
  service_item: false,
  is_batch_available: false,
  is_active: true,
}

const VALUATION_METHODS = ['FIFO', 'LIFO', 'Weighted Average']

const bonusColumns: TableColumn[] = [
  { key: 'min_quantity', header: 'Qty (Greater than or Equal)' },
  { key: 'bonus_quantity', header: 'Bonus Qty' },
  { key: 'actions', header: 'Action', width: '70px', align: 'center' },
]

export interface ProductsFormProps {
  drawerRef: DrawerRef<boolean>
  product?: IProducts
  /** Open read-only: all fields disabled, no save/add/remove actions. */
  view?: boolean
}

const ProductsForm = ({ drawerRef, product, view = false }: ProductsFormProps) => {
  const notify = useLUINotification()
  const createProducts = useCreateProducts()
  const updateProducts = useUpdateProducts()

  const { data: categories } = useDropdown('categorys')
  const { data: taxTypes } = useDropdown('taxtypes')
  const { data: packings } = useDropdown('packings')
  const { data: units } = useDropdown('units')

  const isEdit = !!product
  const saving = createProducts.isPending || updateProducts.isPending

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductsFormValues>({
    resolver: zodResolver(productSchema),
    mode: 'onTouched',
    defaultValues: product ?? emptyProductValues,
  })

  const bonusInfos = useFieldArray({ control, name: 'bonus_infos' })

  const onSubmit = async (values: ProductsFormValues) => {
    try {
      if (isEdit) {
        await updateProducts.mutateAsync({ id: product.id, body: values })
        notify.success('Product Updated', `"${values.name}" has been updated.`)
      } else {
        await createProducts.mutateAsync(values)
        notify.success('Product Created', `"${values.name}" has been added.`)
      }
      drawerRef.close(true)
    } catch (error) {
      notify.error(isEdit ? 'Update Failed' : 'Create Failed', getErrorMessage(error))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} style={{ height: '100%' }}>
      <LUIFlex vertical gap="middle" style={{ height: '100%', padding: '20px' }}>
        <LUIFlex justify="space-between" align="center">
          <div>
            <h2 style={{ margin: 0 }}>{view ? 'View' : isEdit ? 'Update' : 'Add'} Product</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {view ? 'Product information.' : 'Provide required information to add Product.'}
            </p>
          </div>
          <LUIButton
            variant="outlined"
            rounded
            size="sm"
            aria-label="Close"
            onClick={() => drawerRef.close()}
          >
            <LUIIcon name="close" size={16} />
          </LUIButton>
        </LUIFlex>

        <LUIFlex
          vertical
          gap="large"
          /* overflowX hidden: LUIRow's negative gutter margins would otherwise force a horizontal scrollbar. */
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}
        >
          <LUIFlex vertical gap={12}>
            <h3 className="title">Product Details</h3>
            <LUIRow gutter={[16, 16]}>
              <LUICol span={12} md={3}>
                <LUITextInput
                  label="Product Code"
                  placeholder="Enter Product Code"
                  error={errors.code?.message}
                  disabled={view}
                  {...register('code')}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUITextInput
                  label="Product Name"
                  placeholder="Enter Product Name"
                  error={errors.name?.message}
                  required
                  disabled={view}
                  {...register('name')}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUITextInput
                  label="Bar Code"
                  placeholder="Enter Bar Code"
                  error={errors.barcode?.message}
                  disabled={view}
                  {...register('barcode')}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUIToggle label="Active Status" disabled={view} {...register('is_active')} />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUISelect
                  label="Category"
                  placeholder="Select Category"
                  items={categories ?? []}
                  bindLabel="name"
                  bindValue="id"
                  searchable
                  disabled={view}
                  value={watch('category_id') || null}
                  onChange={(value) => setValue('category_id', value as number)}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUISelect
                  label="Tax Type"
                  placeholder="Select Tax Type"
                  items={taxTypes ?? []}
                  bindLabel="name"
                  bindValue="id"
                  searchable
                  disabled={view}
                  value={watch('tax_type_id') || null}
                  onChange={(value) => setValue('tax_type_id', value as number)}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <div className="form-group">
                  <label>Type</label>
                  <LUIFlex gap="middle">
                    <LUICheckbox label="Purchasable" disabled={view} {...register('purchasable')} />
                    <LUICheckbox label="Sellable" disabled={view} {...register('sellable')} />
                  </LUIFlex>
                </div>
              </LUICol>

              <LUICol span={12} md={3}>
                <LUIToggle label="Service Item" disabled={view} {...register('service_item')} />
              </LUICol>

              <LUICol span={12}>
                <LUITextarea
                  label="Remarks"
                  placeholder="Enter Remarks"
                  rows={1}
                  error={errors.remarks?.message}
                  disabled={view}
                  {...register('remarks')}
                />
              </LUICol>
            </LUIRow>
          </LUIFlex>

          <LUIFlex vertical gap={12}>
            <h3 className="title">Unit of Measurement</h3>
            <LUIRow gutter={[16, 16]}>
              <LUICol span={12} md={3}>
                <LUISelect
                  label="Packing"
                  placeholder="Select Packing"
                  items={packings ?? []}
                  bindLabel="name"
                  bindValue="id"
                  searchable
                  disabled={view}
                  value={watch('packing_id') || null}
                  onChange={(value) => setValue('packing_id', value as number)}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUISelect
                  label="Unit"
                  placeholder="Select Primary Unit"
                  items={units ?? []}
                  bindLabel="name"
                  bindValue="id"
                  searchable
                  disabled={view}
                  value={watch('unit_id') || null}
                  onChange={(value) => setValue('unit_id', value as number)}
                />
              </LUICol>
            </LUIRow>
          </LUIFlex>

          <LUIFlex vertical gap={12}>
            <h3 className="title">Pricing</h3>
            <LUIRow gutter={[16, 16]}>
              <LUICol span={12} md={3}>
                <LUINumberInput
                  label="Cost Price"
                  placeholder="Enter Cost Price"
                  error={errors.cost_price?.message}
                  disabled={view}
                  {...register('cost_price')}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUINumberInput
                  label="Selling Price"
                  placeholder="Enter Selling Price"
                  error={errors.selling_price?.message}
                  disabled={view}
                  {...register('selling_price')}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUINumberInput
                  label="MRP"
                  placeholder="Enter MRP"
                  error={errors.mrp?.message}
                  disabled={view}
                  {...register('mrp')}
                />
              </LUICol>
            </LUIRow>
          </LUIFlex>

          <LUIFlex vertical gap={12}>
            <h3 className="title">Stock Information</h3>
            <LUIRow gutter={[16, 16]}>
              <LUICol span={12} md={3}>
                <LUINumberInput
                  label="Max Stock"
                  placeholder="Enter Max Stock"
                  error={errors.max_stock?.message}
                  disabled={view}
                  {...register('max_stock')}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUINumberInput
                  label="Min Stock"
                  placeholder="Enter Min Stock"
                  error={errors.min_stock?.message}
                  disabled={view}
                  {...register('min_stock')}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUISelect
                  label="Valuation Method"
                  placeholder="Select"
                  items={VALUATION_METHODS}
                  disabled={view}
                  value={watch('valuation_method') || null}
                  onChange={(value) => setValue('valuation_method', value as string)}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUIToggle
                  label="Enable Batch Lot"
                  disabled={view}
                  {...register('is_batch_available')}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUIToggle
                  label="Enable Expiry Date"
                  disabled={view}
                  {...register('has_expiry_date')}
                />
              </LUICol>

              <LUICol span={12} md={3}>
                <LUIToggle
                  label="Enable Manufacturing Date"
                  disabled={view}
                  {...register('has_manufacturing_date')}
                />
              </LUICol>
            </LUIRow>
          </LUIFlex>

          <LUIFlex vertical gap={12}>
            <LUIFlex justify="space-between" align="center">
              <h3 className="title">Bonus/Free Information</h3>
              {!view && (
                <LUIButton
                  variant="outlined"
                  onClick={() => bonusInfos.append({ min_quantity: 0, bonus_quantity: 0 })}
                >
                  <LUIIcon name="add" size={16} /> Add Entry
                </LUIButton>
              )}
            </LUIFlex>
            <LUITable
              columns={bonusColumns}
              data={bonusInfos.fields}
              rowKey="id"
              emptyText="No Bonus/Free Information Found."
            >
              <LUITableCell column="min_quantity">
                {({ index }) => (
                  <LUINumberInput
                    placeholder="Enter Quantity"
                    error={errors.bonus_infos?.[index]?.min_quantity?.message}
                    disabled={view}
                    {...register(`bonus_infos.${index}.min_quantity`)}
                  />
                )}
              </LUITableCell>

              <LUITableCell column="bonus_quantity">
                {({ index }) => (
                  <LUINumberInput
                    placeholder="Enter Bonus Quantity"
                    error={errors.bonus_infos?.[index]?.bonus_quantity?.message}
                    disabled={view}
                    {...register(`bonus_infos.${index}.bonus_quantity`)}
                  />
                )}
              </LUITableCell>

              <LUITableCell column="actions">
                {({ index }) => (
                  <LUIButton
                    variant="outlined"
                    size="sm"
                    rounded
                    aria-label="Remove entry"
                    disabled={view}
                    onClick={() => bonusInfos.remove(index)}
                  >
                    <LUIIcon name="trash" size={16} />
                  </LUIButton>
                )}
              </LUITableCell>
            </LUITable>
          </LUIFlex>
        </LUIFlex>

        <LUIFlex justify="end" gap="small">
          <LUIButton variant="outlined" disabled={saving} onClick={() => drawerRef.close()}>
            {view ? 'Close' : 'Cancel'}
          </LUIButton>
          {!view && (
            <LUIButton type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : `${isEdit ? 'Update' : 'Add'} Product`}
            </LUIButton>
          )}
        </LUIFlex>
      </LUIFlex>
    </form>
  )
}

export default ProductsForm
