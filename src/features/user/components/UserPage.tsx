import { useState } from 'react'
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
import { getErrorMessage } from '../user.api'
import { useUserList, useDeleteUser } from '../user.query'
import type { IUser } from '../user.types'
import UserForm from './UserForm'

const columns: TableColumn[] = [
  { key: 'sn', header: 'S.N.', width: '70px' },
  { key: 'username', header: 'Username', sortable: true },
  { key: 'full_name', header: 'Full Name', sortable: true },
  { key: 'contact', header: 'Contact', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'role_name', header: 'Role', sortable: true },
  { key: 'isActive', header: 'Status', width: '120px', align: 'center' },
  { key: 'actions', header: 'Actions', width: '150px', align: 'center' },
]

const STATUS_OPTIONS = [
  { id: '1', name: 'Active' },
  { id: '0', name: 'Inactive' },
]

const filterColumns: FilterColumn[] = [
  { name: 'Contact', formcontrolName: 'contact', type: 'text' },
  { name: 'Email', formcontrolName: 'email', type: 'text' },
  { name: 'Status', formcontrolName: 'isActive', type: 'select', data: STATUS_OPTIONS },
]

const UserPage = () => {
  const drawer = useLUIDrawer()
  const modal = useLUIModal()
  const notify = useLUINotification()

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<TableSort | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data, isFetching } = useUserList({
    pageIndex,
    pageSize,
    ...(sort && { sort: `${sort.key}:${sort.direction}` }),
    ...filters,
  })
  const deleteUser = useDeleteUser()

  const users = data?.content ?? []
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

  const openForm = (user?: IUser, view = false) => {
    drawer.open<boolean>((ref) => <UserForm drawerRef={ref} userId={user?.id} view={view} />, {
      size: '640px',
    })
  }

  const confirmDelete = (user: IUser) => {
    const ref = modal.open<boolean>(
      (modalRef) => (
        <LUIConfirmDialog
          modalRef={modalRef}
          data={{
            title: 'Delete User',
            message: `Are you sure you want to delete "${user.full_name}"? This cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: () =>
              deleteUser.mutateAsync(user.id).catch((error) => {
                notify.error('Delete Failed', getErrorMessage(error))
                throw error
              }),
          }}
        />
      ),
      { width: '420px' },
    )

    void ref.afterClosed().then((confirmed) => {
      if (confirmed) notify.success('User Deleted', `"${user.full_name}" has been removed.`)
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

        <LUIButton onClick={() => openForm()}>Add User</LUIButton>
      </LUIFlex>

      <LUICard className="table-card">
        <LUITable
          columns={columns}
          data={users}
          rowKey="id"
          serverSort
          sort={sort}
          onSortChange={onSortChange}
          loading={isFetching}
          emptyText="No users found"
        >
          <LUITableCell<IUser> column="sn">
            {({ index }) => pageIndex * pageSize + index + 1}
          </LUITableCell>

          <LUITableCell<IUser> column="isActive">
            {({ row }) => (
              <LUIChip variant={row.is_active ? 'success' : 'error'} dot>
                {row.is_active ? 'Active' : 'Inactive'}
              </LUIChip>
            )}
          </LUITableCell>

          <LUITableCell<IUser> column="actions">
            {({ row }) => (
              <LUIFlex justify="center" gap="small">
                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`View ${row.full_name}`}
                  onClick={() => openForm(row, true)}
                >
                  <LUIIcon name="eye" size={16} />
                </LUIButton>

                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`Edit ${row.full_name}`}
                  onClick={() => openForm(row)}
                >
                  <LUIIcon name="edit" size={16} />
                </LUIButton>

                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`Delete ${row.full_name}`}
                  onClick={() => confirmDelete(row)}
                >
                  <LUIIcon name="trash" size={16} />
                </LUIButton>
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

export default UserPage
