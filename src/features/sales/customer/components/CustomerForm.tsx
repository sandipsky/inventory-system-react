import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  DrawerRef,
  LUIButton,
  LUICol,
  LUIFlex,
  LUIIcon,
  LUIRow,
  LUISpacer,
  LUITextarea,
  LUITextInput,
  LUIToggle,
  useLUINotification,
} from '@/components'
import { getErrorMessage } from '../customer.api'
import { useCreateCustomer, useUpdateCustomer } from '../customer.query'
import type { ICustomer } from '../customer.types'

const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  contact: z.string(),
  address: z.string(),
  email: z.email('Invalid email address').or(z.literal('')),
  remarks: z.string(),
  registration_number: z.string(),
  is_active: z.boolean(),
})

type CustomerFormValues = z.infer<typeof customerSchema>

const emptyCustomerValues: CustomerFormValues = {
  name: '',
  contact: '',
  address: '',
  email: '',
  remarks: '',
  registration_number: '',
  is_active: true,
}

export interface CustomerFormProps {
  drawerRef: DrawerRef<boolean>
  customer?: ICustomer
  /** Open read-only: all fields rendered as plain text, no save action. */
  view?: boolean
}

const CustomerForm = ({ drawerRef, customer, view = false }: CustomerFormProps) => {
  const notify = useLUINotification()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const isEdit = !!customer
  const saving = createCustomer.isPending || updateCustomer.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    mode: 'onTouched',
    defaultValues: customer ?? emptyCustomerValues,
  })

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      if (isEdit) {
        await updateCustomer.mutateAsync({ id: customer.id, body: values })
        notify.success('Customer Updated', `"${values.name}" has been updated.`)
      } else {
        await createCustomer.mutateAsync(values)
        notify.success('Customer Created', `"${values.name}" has been added.`)
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
            <h2 className="page-title">{view ? 'View' : isEdit ? 'Update' : 'Add'} Customer</h2>
            <p className="sub-title">
              {view ? 'Customer information.' : 'Provide required information to add Customer.'}
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

        <LUIFlex vertical className="drawer__body">
          <h3 className="title">Customer Details</h3>
          <LUISpacer h={12} />
          <LUIRow gutter={[16, 16]}>
              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Customer Name"
                  placeholder="Enter Customer Name"
                  error={errors.name?.message}
                  required
                  viewMode={view}
                  viewValue={customer?.name}
                  {...register('name')}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Contact"
                  placeholder="Enter Contact"
                  error={errors.contact?.message}
                  viewMode={view}
                  viewValue={customer?.contact}
                  {...register('contact')}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Email"
                  placeholder="Enter Email"
                  error={errors.email?.message}
                  viewMode={view}
                  viewValue={customer?.email}
                  {...register('email')}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Registration Number"
                  placeholder="Enter Registration Number"
                  error={errors.registration_number?.message}
                  viewMode={view}
                  viewValue={customer?.registration_number}
                  {...register('registration_number')}
                />
              </LUICol>

              <LUICol span={12}>
                <LUITextInput
                  label="Address"
                  placeholder="Enter Address"
                  error={errors.address?.message}
                  viewMode={view}
                  viewValue={customer?.address}
                  {...register('address')}
                />
              </LUICol>

              <LUICol span={12}>
                <LUITextarea
                  label="Remarks"
                  placeholder="Enter Remarks"
                  rows={2}
                  error={errors.remarks?.message}
                  viewMode={view}
                  viewValue={customer?.remarks}
                  {...register('remarks')}
                />
              </LUICol>

              <LUICol span={12}>
                <LUIToggle
                  labelPosition="top"
                  label="Active Status"
                  viewMode={view}
                  viewValue={customer?.is_active}
                  {...register('is_active')}
                />
              </LUICol>
          </LUIRow>
        </LUIFlex>

        {!view && (
          <LUIFlex justify="end" gap="small" className="drawer__footer">
            <LUIButton variant="outlined" disabled={saving} onClick={() => drawerRef.close()}>
              Cancel
            </LUIButton>
            <LUIButton type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : `${isEdit ? 'Update' : 'Add'} Customer`}
            </LUIButton>
          </LUIFlex>
        )}
      </LUIFlex>
    </form>
  )
}

export default CustomerForm
