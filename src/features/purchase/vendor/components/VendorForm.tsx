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
import { getErrorMessage } from '../vendor.api'
import { useCreateVendor, useUpdateVendor } from '../vendor.query'
import type { IVendor } from '../vendor.types'

const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  contact: z.string(),
  address: z.string(),
  email: z.email('Invalid email address').or(z.literal('')),
  remarks: z.string(),
  registration_number: z.string(),
  is_active: z.boolean(),
})

type VendorFormValues = z.infer<typeof vendorSchema>

const emptyVendorValues: VendorFormValues = {
  name: '',
  contact: '',
  address: '',
  email: '',
  remarks: '',
  registration_number: '',
  is_active: true,
}

export interface VendorFormProps {
  drawerRef: DrawerRef<boolean>
  vendor?: IVendor
  /** Open read-only: all fields rendered as plain text, no save action. */
  view?: boolean
}

const VendorForm = ({ drawerRef, vendor, view = false }: VendorFormProps) => {
  const notify = useLUINotification()
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()

  const isEdit = !!vendor
  const saving = createVendor.isPending || updateVendor.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    mode: 'onTouched',
    defaultValues: vendor ?? emptyVendorValues,
  })

  const onSubmit = async (values: VendorFormValues) => {
    try {
      if (isEdit) {
        await updateVendor.mutateAsync({ id: vendor.id, body: values })
        notify.success('Vendor Updated', `"${values.name}" has been updated.`)
      } else {
        await createVendor.mutateAsync(values)
        notify.success('Vendor Created', `"${values.name}" has been added.`)
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
            <h2 className="page-title">{view ? 'View' : isEdit ? 'Update' : 'Add'} Vendor</h2>
            <p className="sub-title">
              {view ? 'Vendor information.' : 'Provide required information to add Vendor.'}
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
          <h3 className="title">Vendor Details</h3>
          <LUISpacer h={12} />
          <LUIRow gutter={[16, 16]}>
              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Vendor Name"
                  placeholder="Enter Vendor Name"
                  error={errors.name?.message}
                  required
                  viewMode={view}
                  viewValue={vendor?.name}
                  {...register('name')}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Contact"
                  placeholder="Enter Contact"
                  error={errors.contact?.message}
                  viewMode={view}
                  viewValue={vendor?.contact}
                  {...register('contact')}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Email"
                  placeholder="Enter Email"
                  error={errors.email?.message}
                  viewMode={view}
                  viewValue={vendor?.email}
                  {...register('email')}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Registration Number"
                  placeholder="Enter Registration Number"
                  error={errors.registration_number?.message}
                  viewMode={view}
                  viewValue={vendor?.registration_number}
                  {...register('registration_number')}
                />
              </LUICol>

              <LUICol span={12}>
                <LUITextInput
                  label="Address"
                  placeholder="Enter Address"
                  error={errors.address?.message}
                  viewMode={view}
                  viewValue={vendor?.address}
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
                  viewValue={vendor?.remarks}
                  {...register('remarks')}
                />
              </LUICol>

              <LUICol span={12}>
                <LUIToggle
                  labelPosition="top"
                  label="Active Status"
                  viewMode={view}
                  viewValue={vendor?.is_active}
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
              {saving ? 'Saving…' : `${isEdit ? 'Update' : 'Add'} Vendor`}
            </LUIButton>
          </LUIFlex>
        )}
      </LUIFlex>
    </form>
  )
}

export default VendorForm
