import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  DrawerRef,
  LUIButton,
  LUICard,
  LUICheckbox,
  LUICol,
  LUIFlex,
  LUIIcon,
  LUIRow,
  LUISpacer,
  LUITab,
  LUITabs,
  LUITextarea,
  LUITextInput,
  LUIToggle,
  useLUINotification,
} from '@/components'
import { getErrorMessage } from '../../setup'
import { useCreateRole, useRoleOperations, useUpdateRole } from '../roles-permissions.query'
import type { IRole, IRoleMasterModule, IRoleModule } from '../roles-permissions.types'
import './rolespermissions.css'

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string(),
  is_active: z.boolean(),
})

type RoleFormValues = z.infer<typeof roleSchema>

const emptyRoleValues: RoleFormValues = {
  name: '',
  description: '',
  is_active: true,
}

/** "PurchaseEntry" -> "Purchase Entry" */
const splitPascal = (value: string) => value.replace(/([a-z])([A-Z])/g, '$1 $2')

/** "ViewOutstandingPayables" -> "Allow user to view Outstanding Payables." */
const operationLabel = (name: string) => {
  const [verb, ...rest] = splitPascal(name).split(' ')
  return `Allow user to ${verb.toLowerCase()} ${rest.join(' ')}.`.replace(/\s+\./, '.')
}

const isModuleSelected = (module: IRoleModule) =>
  module.operations.every((operation) => operation.selected)

const isMasterSelected = (master: IRoleMasterModule) => master.modules.every(isModuleSelected)

export interface RolesPermissionsFormProps {
  drawerRef: DrawerRef<boolean>
  role?: IRole
  /** Open read-only: all fields rendered as plain text, no save action. */
  view?: boolean
}

const RolesPermissionsForm = ({ drawerRef, role, view = false }: RolesPermissionsFormProps) => {
  const notify = useLUINotification()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()

  const { data: operationsData } = useRoleOperations(role?.id ?? 0)

  const [permissions, setPermissions] = useState<IRoleMasterModule[]>([])

  /* Seed once per open — a background refetch must not clobber in-progress ticks. */
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || !operationsData) return
    seeded.current = true
    setPermissions(operationsData)
  }, [operationsData])

  const isEdit = !!role
  const saving = createRole.isPending || updateRole.isPending

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    mode: 'onTouched',
    defaultValues: role ?? emptyRoleValues,
  })

  /* moduleIndex null = whole master module; operationId null = whole module. */
  const setSelected = (
    masterIndex: number,
    moduleIndex: number | null,
    operationId: number | null,
    selected: boolean,
  ) => {
    setPermissions((prev) =>
      prev.map((master, mi) =>
        mi !== masterIndex
          ? master
          : {
              ...master,
              modules: master.modules.map((module, ji) =>
                moduleIndex !== null && ji !== moduleIndex
                  ? module
                  : {
                      ...module,
                      operations: module.operations.map((operation) =>
                        operationId !== null && operation.id !== operationId
                          ? operation
                          : { ...operation, selected },
                      ),
                    },
              ),
            },
      ),
    )
  }

  const onSubmit = async (values: RoleFormValues) => {
    const operation_ids = permissions.flatMap((master) =>
      master.modules.flatMap((module) =>
        module.operations.filter((operation) => operation.selected).map((operation) => operation.id),
      ),
    )
    const body = { ...values, operation_ids }

    try {
      if (isEdit) {
        await updateRole.mutateAsync({ id: role.id, body })
        notify.success('Role Updated', `"${values.name}" has been updated.`)
      } else {
        await createRole.mutateAsync(body)
        notify.success('Role Created', `"${values.name}" has been added.`)
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
            <h2 className="page-title">{view ? 'View' : isEdit ? 'Update' : 'Add'} Role</h2>
            <p className="sub-title">
              {view ? 'Role information.' : 'Provide required information to add Role.'}
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

        <LUIFlex vertical gap="large" className="drawer__body">
          <LUICard>
            <h3 className="title">Role Details</h3>
            <LUISpacer h={12} />
            <LUIRow gutter={[16, 16]}>
                <LUICol span={12} md={4}>
                  <LUITextInput
                    label="Role Name"
                    placeholder="Enter Role Name"
                    error={errors.name?.message}
                    required
                    viewMode={view}
                    viewValue={role?.name}
                    {...register('name')}
                  />
                </LUICol>

                <LUICol span={12} md={4}>
                  <LUITextarea
                    label="Description"
                    placeholder="Enter Description"
                    rows={1}
                    error={errors.description?.message}
                    viewMode={view}
                    viewValue={role?.description}
                    {...register('description')}
                  />
                </LUICol>

                <LUICol span={12} md={4}>
                  <LUIToggle
                    labelPosition="top"
                    label="Active Status"
                    viewMode={view}
                    viewValue={role?.is_active}
                    {...register('is_active')}
                  />
                </LUICol>
            </LUIRow>
          </LUICard>

          <LUICard>
            <h3 className="title">Permissions</h3>
            <LUISpacer h={12} />
            <LUITabs>
              {permissions.map((master, masterIndex) => (
                <LUITab key={master.master_module} label={master.master_module}>
                  <LUISpacer h={12} />
                  <div className="permission-select-all">
                    <LUICheckbox
                      label="Select All"
                      checked={isMasterSelected(master)}
                      disabled={view}
                      onChange={(event) => setSelected(masterIndex, null, null, event.target.checked)}
                    />
                    <span className="permission-select-all-hint">
                      (All the permissions for {master.master_module} will be granted.)
                    </span>
                  </div>

                  {master.modules.map((module, moduleIndex) => (
                    <div key={module.module_name} className="permission-module">
                      <div className="permission-module-head">
                        <LUICheckbox
                          label={splitPascal(module.module_name)}
                          checked={isModuleSelected(module)}
                          disabled={view}
                          onChange={(event) =>
                            setSelected(masterIndex, moduleIndex, null, event.target.checked)
                          }
                        />
                      </div>

                      <div className="permission-operations">
                        {module.operations.map((operation) => (
                          <LUICheckbox
                            key={operation.id}
                            label={operationLabel(operation.name)}
                            checked={operation.selected}
                            disabled={view}
                            onChange={(event) =>
                              setSelected(masterIndex, moduleIndex, operation.id, event.target.checked)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </LUITab>
              ))}
            </LUITabs>
          </LUICard>
        </LUIFlex>

        {!view && (
          <LUIFlex justify="end" gap="small" className="drawer__footer">
            <LUIButton variant="outlined" disabled={saving} onClick={() => drawerRef.close()}>
              Cancel
            </LUIButton>
            <LUIButton type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : `${isEdit ? 'Update' : 'Add'} Role`}
            </LUIButton>
          </LUIFlex>
        )}
      </LUIFlex>
    </form>
  )
}

export default RolesPermissionsForm
