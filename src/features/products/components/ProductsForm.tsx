import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  DrawerRef,
  LUIButton,
  LUIFlex,
  LUITextInput,
  LUIToggle,
  useLUINotification,
} from '@/components'
import { useCreateProducts, useUpdateProducts } from '../products.query'
import type { IProducts } from '../products.types'

const productSchema = z.object({
  name: z.string().min(1, 'Products name is required'),
  is_active: z.boolean(),
})

type ProductsFormValues = z.infer<typeof productSchema>

const getErrorMessage = (error: unknown) =>
  isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
    : 'Something went wrong'

export interface ProductsFormProps {
  drawerRef: DrawerRef<boolean>
  product?: IProducts
}

const ProductsForm = ({ drawerRef, product }: ProductsFormProps) => {
  const notify = useLUINotification()
  const createProducts = useCreateProducts()
  const updateProducts = useUpdateProducts()

  const isEdit = !!product
  const saving = createProducts.isPending || updateProducts.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductsFormValues>({
    resolver: zodResolver(productSchema),
    mode: 'onTouched',
    defaultValues: {
      name: product?.name ?? '',
      is_active: product?.is_active ?? true,
    },
  })

  const onSubmit = async (values: ProductsFormValues) => {
    try {
      if (isEdit) {
        await updateProducts.mutateAsync({ id: product.id, body: values })
        notify.success('Products Updated', `"${values.name}" has been updated.`)
      } else {
        await createProducts.mutateAsync(values)
        notify.success('Products Created', `"${values.name}" has been added.`)
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
          <h2>{isEdit ? 'Edit Products' : 'Add Products'}</h2>
          <LUIButton
            variant="outlined"
            rounded
            aria-label="Close"
            onClick={() => drawerRef.close()}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5 5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </LUIButton>
        </LUIFlex>

        <LUITextInput
          label="Name"
          placeholder="Products name"
          error={errors.name?.message}
          required
          {...register('name')}
        />

        <LUIToggle label="Active" {...register('is_active')} />

        <LUIFlex justify="end" gap="small" style={{ marginTop: 'auto' }}>
          <LUIButton variant="outlined" disabled={saving} onClick={() => drawerRef.close()}>
            Cancel
          </LUIButton>
          <LUIButton type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Update' : 'Save'}
          </LUIButton>
        </LUIFlex>
      </LUIFlex>
    </form>
  )
}

export default ProductsForm
