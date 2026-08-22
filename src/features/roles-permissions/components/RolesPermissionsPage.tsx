import { useState } from 'react'
import { isAxiosError } from 'axios'
import {
  LUIButton,
  LUICard,
  LUIChip,
  LUIConfirmDialog,
  LUIFilter,
  LUIFlex,
  LUIIcon,
  LUIPagination,
  LUITable,
  LUITableCell,
  useLUIDrawer,
  useLUIModal,
  useLUINotification,
  type FilterChange,
  type FilterColumn,
  type PageEvent,
  type TableColumn,
  type TableSort,
} from '@/components'
import { useAuthStore } from '@/features/auth'
import { useRoleList, useDeleteRole } from '../roles-permissions.query'
import type { IRole } from '../roles-permissions.types'
import RolesPermissionsForm from './RolesPermissionsForm'

const columns: TableColumn[] = [
  { key: 'sn', header: 'S.N.', width: '70px' },
  { key: 'name', header: 'Role Name', sortable: true },
  { key: 'description', header: 'Description' },
  { key: 'isActive', header: 'Status', width: '120px', align: 'center' },
  { key: 'actions', header: 'Actions', width: '150px', align: 'center' },
]

const STATUS_OPTIONS = [
  { id: '1', name: 'Active' },
  { id: '0', name: 'Inactive' },
]

const filterColumns: FilterColumn[] = [
  { name: 'Status', formcontrolName: 'isActive', type: 'select', data: STATUS_OPTIONS },
]

const getErrorMessage = (error: unknown) =>
  isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
    : 'Something went wrong'

const RolesPermissionsPage = () => {
  const drawer = useLUIDrawer()
  const modal = useLUIModal()
  const notify = useLUINotification()

  const operations = useAuthStore((s) => s.operations)
  const canCreate = operations.includes('CreateRole')
  const canEdit = operations.includes('EditRole')
  const canDelete = operations.includes('DeleteRole')

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<TableSort | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data, isFetching } = useRoleList({
    pageIndex,
    pageSize,
    ...(sort && { sort: `${sort.key}:${sort.direction}` }),
    ...filters,
  })
  const deleteRole = useDeleteRole()

  const roles = data?.content ?? []
  const totalCount = data?.totalElements ?? 0

  const onFilterChange = (changes: FilterChange[]) => {
    const next: Record<string, string> = {}
    for (const change of changes) {
      if (change.value) next[change.field] = change.value
    }
    setFilters(next)
    setPageIndex(0)
  }

  const onPageChange = (event: PageEvent) => {
    setPageIndex(event.pageIndex)
    setPageSize(event.pageSize)
  }

  const onSortChange = (next: TableSort | null) => {
    setSort(next)
    setPageIndex(0)
  }

  const openForm = (role?: IRole, view = false) => {
    drawer.open<boolean>((ref) => <RolesPermissionsForm drawerRef={ref} role={role} view={view} />, {
      size: '99vh',
      position: 'bottom',
    })
  }

  const confirmDelete = (role: IRole) => {
    const ref = modal.open<boolean>(
      (modalRef) => (
        <LUIConfirmDialog
          modalRef={modalRef}
          data={{
            title: 'Delete Role',
            message: `Are you sure you want to delete "${role.name}"? This cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: () =>
              deleteRole.mutateAsync(role.id).catch((error) => {
                notify.error('Delete Failed', getErrorMessage(error))
                throw error
              }),
          }}
        />
      ),
      { width: '420px' },
    )

    void ref.afterClosed().then((confirmed) => {
      if (confirmed) notify.success('Role Deleted', `"${role.name}" has been removed.`)
    })
  }

  return (
    <>
      <LUIFlex justify="space-between" align="center">
        <LUIFilter
          searchBy="name"
          filterColumns={filterColumns}
          onFilterChange={onFilterChange}
        />

        {canCreate && <LUIButton onClick={() => openForm()}>Add Role</LUIButton>}
      </LUIFlex>

      <LUICard className="table-card">
        <LUITable
          columns={columns}
          data={roles}
          rowKey="id"
          serverSort
          sort={sort}
          onSortChange={onSortChange}
          loading={isFetching}
          emptyText="No roles found"
        >
          <LUITableCell<IRole> column="sn">
            {({ index }) => pageIndex * pageSize + index + 1}
          </LUITableCell>

          <LUITableCell<IRole> column="isActive">
            {({ row }) => (
              <LUIChip variant={row.is_active ? 'success' : 'error'} dot>
                {row.is_active ? 'Active' : 'Inactive'}
              </LUIChip>
            )}
          </LUITableCell>

          <LUITableCell<IRole> column="actions">
            {({ row }) => (
              <LUIFlex justify="center" gap="small">
                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`View ${row.name}`}
                  onClick={() => openForm(row, true)}
                >
                  <LUIIcon name="eye" size={16} />
                </LUIButton>

                {canEdit && (
                  <LUIButton
                    variant="outlined"
                    size="sm"
                    rounded
                    aria-label={`Edit ${row.name}`}
                    onClick={() => openForm(row)}
                  >
                    <LUIIcon name="edit" size={16} />
                  </LUIButton>
                )}

                {canDelete && (
                  <LUIButton
                    variant="outlined"
                    size="sm"
                    rounded
                    aria-label={`Delete ${row.name}`}
                    onClick={() => confirmDelete(row)}
                  >
                    <LUIIcon name="trash" size={16} />
                  </LUIButton>
                )}
              </LUIFlex>
            )}
          </LUITableCell>
        </LUITable>

        <LUIPagination
          length={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </LUICard>
    </>
  )
}

export default RolesPermissionsPage
