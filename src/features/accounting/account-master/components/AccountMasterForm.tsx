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
  LUISelect,
  LUISpacer,
  LUITextarea,
  LUITextInput,
  LUIToggle,
  useLUINotification,
} from '@/components'
import { getErrorMessage } from '../../../setup'
import {
  useAccountMasterById,
  useAccountTypes,
  useCreateAccountMaster,
  useParentAccounts,
  useUpdateAccountMaster,
} from '../account-master.query'

const accountSchema = z.object({
  account_name: z.string().min(1, 'Account name is required'),
  account_code: z.string(),
  account_type: z.string().min(1, 'Account type is required'),
  parent_id: z.number().nullable(),
  remarks: z.string(),
  is_active: z.boolean(),
})

type AccountFormValues = z.infer<typeof accountSchema>

const emptyAccountValues: AccountFormValues = {
  account_name: '',
  account_code: '',
  account_type: '',
  parent_id: null,
  remarks: '',
  is_active: true,
}

export interface AccountMasterFormProps {
  drawerRef: DrawerRef<boolean>
  accountId?: number
  /** Open read-only: all fields rendered as plain text, no save action. */
  view?: boolean
}

const AccountMasterForm = ({ drawerRef, accountId, view = false }: AccountMasterFormProps) => {
  const notify = useLUINotification()
  const createAccountMaster = useCreateAccountMaster()
  const updateAccountMaster = useUpdateAccountMaster()

  const { data: account } = useAccountMasterById(accountId ?? 0)
  const { data: accountTypes } = useAccountTypes()

  const isEdit = !!accountId
  const saving = createAccountMaster.isPending || updateAccountMaster.isPending

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    mode: 'onTouched',
    defaultValues: emptyAccountValues,
    values: account
      ? {
          account_name: account.account_name,
          account_code: account.account_code,
          account_type: account.account_type,
          parent_id: account.parent_id,
          remarks: account.remarks,
          is_active: account.is_active,
        }
      : undefined,
  })

  const accountType = watch('account_type')
  const { data: parentAccounts } = useParentAccounts(view ? '' : accountType)

  /* Grouped under sticky headings inside the select. */
  const typeOptions = (accountTypes ?? []).flatMap((group) =>
    group.types.map((type) => ({ name: type, group: group.heading })),
  )

  const onSubmit = async (values: AccountFormValues) => {
    try {
      if (isEdit) {
        await updateAccountMaster.mutateAsync({ id: accountId, body: values })
        notify.success('Account Updated', `"${values.account_name}" has been updated.`)
      } else {
        await createAccountMaster.mutateAsync(values)
        notify.success('Account Created', `"${values.account_name}" has been added.`)
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
            <h2 className="page-title">{view ? 'View' : isEdit ? 'Update' : 'Add'} Account</h2>
            <p className="sub-title">
              {view ? 'Account information.' : 'Provide required information to add Account.'}
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
          <h3 className="title">Account Details</h3>
          <LUISpacer h={12} />
          <LUIRow gutter={[16, 16]}>
              <LUICol span={12}>
                <LUITextInput
                  label="Account Name"
                  placeholder="Enter Account Name"
                  error={errors.account_name?.message}
                  required
                  viewMode={view}
                  viewValue={account?.account_name}
                  {...register('account_name')}
                />
              </LUICol>

              <LUICol span={12}>
                <LUITextInput
                  label="Account Code"
                  placeholder="Enter Account Code"
                  error={errors.account_code?.message}
                  viewMode={view}
                  viewValue={account?.account_code}
                  {...register('account_code')}
                />
              </LUICol>

              <LUICol span={12}>
                <LUISelect
                  label="Account Type"
                  placeholder="Select Account"
                  items={typeOptions}
                  bindLabel="name"
                  bindValue="name"
                  groupBy="group"
                  searchable
                  viewMode={view}
                  viewValue={account?.account_type}
                  value={watch('account_type') || null}
                  onChange={(value) => {
                    setValue('account_type', value as string)
                    /* Parent options depend on the type — a stale pick would be invalid. */
                    setValue('parent_id', null)
                  }}
                />
                {errors.account_type && <div className="alert error">{errors.account_type.message}</div>}
              </LUICol>

              <LUICol span={12}>
                <LUISelect
                  label="Parent Account"
                  placeholder="Select Parent Account"
                  items={parentAccounts ?? []}
                  bindLabel="name"
                  bindValue="id"
                  searchable
                  clearable
                  viewMode={view}
                  viewValue={account?.parent_account_name ?? undefined}
                  value={watch('parent_id')}
                  onChange={(value) => setValue('parent_id', (value as number | null) ?? null)}
                />
              </LUICol>

              <LUICol span={12}>
                <LUITextarea
                  label="Remarks"
                  placeholder="Enter Text"
                  rows={2}
                  error={errors.remarks?.message}
                  viewMode={view}
                  viewValue={account?.remarks}
                  {...register('remarks')}
                />
              </LUICol>

              <LUICol span={12}>
                <LUIToggle
                  labelPosition="top"
                  label="Active Status"
                  viewMode={view}
                  viewValue={account?.is_active}
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
              {saving ? 'Saving…' : `${isEdit ? 'Update' : 'Add'} Account`}
            </LUIButton>
          </LUIFlex>
        )}
      </LUIFlex>
    </form>
  )
}

export default AccountMasterForm
