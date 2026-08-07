import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  DrawerRef,
  LUIButton,
  LUIFlex,
  LUIIcon,
  LUINumberInput,
  LUITextInput,
  LUIToggle,
  useLUINotification,
} from '@/components'
import { getErrorMessage } from '../master.api'
import type { MasterQueries } from '../master.query'
import type { IMasterEntity } from '../master.types'

const masterSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tax_rate: z
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100')
    .optional(),
  is_active: z.boolean(),
})

const withTaxRateSchema = masterSchema.refine((values) => values.tax_rate != null, {
  message: 'Tax rate is required',
  path: ['tax_rate'],
})

type MasterFormValues = z.infer<typeof masterSchema>

export interface MasterFormProps {
  drawerRef: DrawerRef<boolean>
  title: string
  queries: MasterQueries
  /** Entity being edited; omit to create a new one. */
  entity?: IMasterEntity
  withTaxRate?: boolean
}

export default function MasterForm({
  drawerRef,
  title,
  queries,
  entity,
  withTaxRate = false,
}: MasterFormProps) {
  const notify = useLUINotification()
  const create = queries.useCreate()
  const update = queries.useUpdate()

  const isEdit = !!entity
  const saving = create.isPending || update.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MasterFormValues>({
    resolver: zodResolver(withTaxRate ? withTaxRateSchema : masterSchema),
    mode: 'onTouched',
    defaultValues: {
      name: entity?.name ?? '',
      tax_rate: entity?.tax_rate,
      is_active: entity?.is_active ?? true,
    },
  })

  const onSubmit = async (values: MasterFormValues) => {
    try {
      if (isEdit) {
        await update.mutateAsync({ id: entity.id, body: values })
        notify.success(`${title} Updated`, `"${values.name}" has been updated.`)
      } else {
        await create.mutateAsync(values)
        notify.success(`${title} Created`, `"${values.name}" has been added.`)
      }
      drawerRef.close(true)
    } catch (error) {
      notify.error(isEdit ? 'Update Failed' : 'Create Failed', getErrorMessage(error))
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="drawer">
      <LUIFlex vertical className="drawer__layout">
        <LUIFlex justify="space-between" align="center" className="drawer__header">
          <div>
            <h2 className="page-title">{isEdit ? 'Update' : 'Add'} {title}</h2>
            <p className="sub-title">Provide required information to {isEdit ? 'update' : 'add'} {title}.</p>
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

        <LUIFlex vertical gap="large" className="drawer__body">

          <LUITextInput
            label="Name"
            placeholder={`${title} name`}
            required
            error={errors.name?.message}
            {...register('name')}
          />

          {withTaxRate && (
            <LUINumberInput
              label="Tax Rate"
              placeholder="0.00"
              suffix="%"
              decimalPlaces={2}
              required
              error={errors.tax_rate?.message}
              {...register('tax_rate', {
                setValueAs: (value) => (value === '' || value == null ? undefined : Number(value)),
              })}
            />
          )}

          <LUIToggle labelPosition="top" label="Active Status" {...register('is_active')} />
        </LUIFlex>

        <LUIFlex justify="end" gap="small" className="drawer__footer">
          <LUIButton variant="outlined" disabled={saving} onClick={() => drawerRef.close()}>
            Cancel
          </LUIButton>
          <LUIButton type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : `${isEdit ? 'Update' : 'Add'} ${title}`}
          </LUIButton>
        </LUIFlex>
      </LUIFlex>
    </form>
  )
}
