import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  DrawerRef,
  LUIButton,
  LUICol,
  LUIFileUpload,
  LUIFlex,
  LUIIcon,
  LUIPasswordInput,
  LUIRow,
  LUISelect,
  LUISpacer,
  LUITextarea,
  LUITextInput,
  LUIToggle,
  useLUINotification,
  type UploadFile,
} from '@/components'
import { useDropdown } from '@/services/dropdown.service'
import { useAuthImage } from '@/services/image.service'
import { getErrorMessage } from '../user.api'
import { useCreateUser, useUpdateUser, useUserById } from '../user.query'

/* Mirrors the LUIPasswordInput `showRules` checklist. */
const meetsPasswordRules = (value: string) =>
  value.length >= 8 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9]/.test(value)

const userSchema = (isEdit: boolean) =>
  z
    .object({
      username: z.string().min(1, 'Username is required'),
      full_name: z.string().min(1, 'Full name is required'),
      email: z.email('Invalid email address').or(z.literal('')),
      contact: z.string(),
      gender: z.string(),
      role_id: z.number(),
      password: z
        .string()
        .refine(
          (value) => (isEdit && value === '') || meetsPasswordRules(value),
          'Password does not meet all requirements',
        ),
      confirm_password: z.string(),
      remarks: z.string(),
      is_active: z.boolean(),
    })
    .refine((values) => values.password === values.confirm_password, {
      message: 'Passwords do not match',
      path: ['confirm_password'],
    })

type UserFormValues = z.infer<ReturnType<typeof userSchema>>

const emptyUserValues: UserFormValues = {
  username: '',
  full_name: '',
  email: '',
  contact: '',
  gender: '',
  role_id: 0,
  password: '',
  confirm_password: '',
  remarks: '',
  is_active: true,
}

const GENDERS = ['Male', 'Female', 'Other']

/** id of the file-upload entry seeded from the user's saved picture. */
const EXISTING_IMAGE_ID = 'existing-image'

export interface UserFormProps {
  drawerRef: DrawerRef<boolean>
  userId?: number
  /** Open read-only: all fields rendered as plain text, no save action. */
  view?: boolean
}

const UserForm = ({ drawerRef, userId, view = false }: UserFormProps) => {
  const notify = useLUINotification()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const { data: roles } = useDropdown('roles', !view)
  const { data: user } = useUserById(userId ?? 0)
  const { data: savedImage } = useAuthImage(user?.image_url)

  const [files, setFiles] = useState<UploadFile[]>([])
  /* Only a newly picked file is sent; the seeded entry means "keep the current one". */
  const image = files.find((f) => f.id !== EXISTING_IMAGE_ID)?.file ?? null

  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !savedImage || !user?.image_url) return
    seeded.current = true
    const name = user.image_url.split('/').pop() ?? 'profile'
    setFiles([
      {
        id: EXISTING_IMAGE_ID,
        file: new File([], name, { type: savedImage.type }),
        name,
        size: savedImage.size,
        type: savedImage.type,
        status: 'success',
        progress: 100,
        url: savedImage.url,
      },
    ])
  }, [savedImage, user?.image_url])

  const isEdit = !!userId
  const saving = createUser.isPending || updateUser.isPending

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema(isEdit)),
    mode: 'onTouched',
    defaultValues: emptyUserValues,
    values: user ? { ...user, password: '', confirm_password: '' } : undefined,
  })

  const onSubmit = async (values: UserFormValues) => {
    /* confirm_password never leaves the client. */
    const { confirm_password, ...body } = values
    void confirm_password
    try {
      if (isEdit) {
        /* Blank password on edit means "keep the current one" — don't send it. */
        const { password, ...rest } = body
        await updateUser.mutateAsync({ id: userId, body: password ? body : rest, image })
        notify.success('User Updated', `"${values.full_name}" has been updated.`)
      } else {
        await createUser.mutateAsync({ body, image })
        notify.success('User Created', `"${values.full_name}" has been added.`)
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
            <h2 className="page-title">{view ? 'View' : isEdit ? 'Update' : 'Add'} User</h2>
            <p className="sub-title">
              {view ? 'User information.' : 'Provide required information to add User.'}
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
          <h3 className="title">User Details</h3>
          <LUISpacer h={12} />
          <LUIRow gutter={[16, 16]}>
              <LUICol span={12}>
                <div className="form-group">
                  <label>Profile Picture</label>
                  {view ? (
                    user?.image_url && savedImage ? (
                      <img
                        src={savedImage.url}
                        alt="Profile"
                        style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div className="view-value">-</div>
                    )
                  ) : (
                    <LUIFileUpload
                      accept="image/*"
                      multiple={false}
                      label="Click or drag an image here to upload"
                      files={files}
                      onFilesChange={setFiles}
                    />
                  )}
                </div>
              </LUICol>

              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Username"
                  placeholder="Enter Username"
                  error={errors.username?.message}
                  required
                  viewMode={view}
                  viewValue={user?.username}
                  {...register('username')}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Full Name"
                  placeholder="Enter Full Name"
                  error={errors.full_name?.message}
                  required
                  viewMode={view}
                  viewValue={user?.full_name}
                  {...register('full_name')}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Email"
                  placeholder="Enter Email"
                  error={errors.email?.message}
                  viewMode={view}
                  viewValue={user?.email}
                  {...register('email')}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUITextInput
                  label="Contact"
                  placeholder="Enter Contact"
                  error={errors.contact?.message}
                  viewMode={view}
                  viewValue={user?.contact}
                  {...register('contact')}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUISelect
                  label="Gender"
                  placeholder="Select Gender"
                  items={GENDERS}
                  viewMode={view}
                  viewValue={user?.gender}
                  value={watch('gender') || null}
                  onChange={(value) => setValue('gender', value as string)}
                />
              </LUICol>

              <LUICol span={12} md={6}>
                <LUISelect
                  label="Role"
                  placeholder="Select Role"
                  items={roles ?? []}
                  bindLabel="name"
                  bindValue="id"
                  searchable
                  viewMode={view}
                  viewValue={user?.role_name}
                  value={watch('role_id') || null}
                  onChange={(value) => setValue('role_id', value as number)}
                />
              </LUICol>

              {!view && (
                <>
                  <LUICol span={12} md={6}>
                    <LUIPasswordInput
                      label="Password"
                      placeholder={isEdit ? 'Leave blank to keep current password' : 'Enter Password'}
                      error={errors.password?.message}
                      required={!isEdit}
                      showRules
                      {...register('password')}
                    />
                  </LUICol>

                  <LUICol span={12} md={6}>
                    <LUIPasswordInput
                      label="Confirm Password"
                      placeholder="Re-enter Password"
                      error={errors.confirm_password?.message}
                      required={!isEdit}
                      {...register('confirm_password')}
                    />
                  </LUICol>
                </>
              )}

              <LUICol span={12}>
                <LUITextarea
                  label="Remarks"
                  placeholder="Enter Remarks"
                  rows={2}
                  error={errors.remarks?.message}
                  viewMode={view}
                  viewValue={user?.remarks}
                  {...register('remarks')}
                />
              </LUICol>

              <LUICol span={12}>
                <LUIToggle
                  labelPosition="top"
                  label="Active Status"
                  viewMode={view}
                  viewValue={user?.is_active}
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
              {saving ? 'Saving…' : `${isEdit ? 'Update' : 'Add'} User`}
            </LUIButton>
          </LUIFlex>
        )}
      </LUIFlex>
    </form>
  )
}

export default UserForm
