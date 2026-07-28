import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  DrawerRef,
  LUIButton,
  LUIFlex,
  LUITextarea,
  LUITextInput,
  LUIToggle,
  useLUINotification,
} from '@/components'
import { useCreateCategory, useUpdateCategory } from '../category.query'
import type { ICategory } from '../category.types'

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  isActive: z.boolean(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

const getErrorMessage = (error: unknown) =>
  isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
    : 'Something went wrong'

export interface CategoryFormProps {
  drawerRef: DrawerRef<boolean>
  /** Category being edited; omit to create a new one. */
  category?: ICategory
}

const CategoryForm = ({ drawerRef, category }: CategoryFormProps) => {
  const notify = useLUINotification()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const isEdit = !!category
  const saving = createCategory.isPending || updateCategory.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      isActive: category?.isActive ?? true,
    },
  })

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (isEdit) {
        await updateCategory.mutateAsync({ id: category.id, body: values })
        notify.success('Category Updated', `"${values.name}" has been updated.`)
      } else {
        await createCategory.mutateAsync(values)
        notify.success('Category Created', `"${values.name}" has been added.`)
      }
      drawerRef.close(true)
    } catch (error) {
      notify.error(isEdit ? 'Update Failed' : 'Create Failed', getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ height: '100%' }}>
      <LUIFlex vertical gap="middle" style={{ height: '100%', padding: '20px' }}>
        <LUIFlex justify="space-between" align="center">
          <h2>{isEdit ? 'Edit Category' : 'Add Category'}</h2>
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
          placeholder="Category name"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <LUITextarea
          label="Description"
          placeholder="Short description (optional)"
          error={errors.description?.message}
          {...register('description')}
        />

        <LUIToggle label="Active" {...register('isActive')} />

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

export default CategoryForm
