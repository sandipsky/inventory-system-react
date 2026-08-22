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
import { useAccountMasterList, useAccountTypes, useDeleteAccountMaster } from '../account-master.query'
import type { IAccountMaster } from '../account-master.types'
import AccountMasterForm from './AccountMasterForm'

const columns: TableColumn[] = [
  { key: 'sn', header: 'SN', width: '70px' },
  { key: 'account_name', header: 'Account Name', sortable: true },
  { key: 'account_code', header: 'Account Code', sortable: true },
  { key: 'account_type', header: 'Account Type', sortable: true },
  { key: 'parent_account_name', header: 'Parent Account' },
  { key: 'isActive', header: 'Status', width: '120px', align: 'center' },
  { key: 'actions', header: 'Action', width: '150px', align: 'center' },
]

/* Server-side sort paths for columns whose row key differs from the API's sort field. */
const SORT_FIELDS: Record<string, string> = {
  account_name: 'name',
  account_code: 'code',
  account_type: 'type',
}

const STATUS_OPTIONS = [
  { id: '1', name: 'Active' },
  { id: '0', name: 'Inactive' },
]

const getErrorMessage = (error: unknown) =>
  isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
    : 'Something went wrong'

const AccountMasterPage = () => {
  const drawer = useLUIDrawer()
  const modal = useLUIModal()
  const notify = useLUINotification()

  const operations = useAuthStore((s) => s.operations)
  const canCreate = operations.includes('CreateAccountMaster')
  const canEdit = operations.includes('EditAccountMaster')
  const canDelete = operations.includes('DeleteAccountMaster')

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<TableSort | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data: accountTypes } = useAccountTypes()

  const typeOptions = (accountTypes ?? []).flatMap((group) =>
    group.types.map((type) => ({ id: type, name: type })),
  )

  const filterColumns: FilterColumn[] = [
    { name: 'Account Code', formcontrolName: 'code', type: 'text' },
    { name: 'Account Type', formcontrolName: 'accountType', type: 'select', data: typeOptions },
    { name: 'Parent Account', formcontrolName: 'parentAccount', type: 'text' },
    { name: 'Status', formcontrolName: 'isActive', type: 'select', data: STATUS_OPTIONS },
  ]

  const { data, isFetching } = useAccountMasterList({
    pageIndex,
    pageSize,
    ...(sort && { sort: `${SORT_FIELDS[sort.key] ?? sort.key}:${sort.direction}` }),
    ...filters,
  })
  const deleteAccountMaster = useDeleteAccountMaster()

  const accounts = data?.content ?? []
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

  const openForm = (account?: IAccountMaster, view = false) => {
    drawer.open<boolean>(
      (ref) => <AccountMasterForm drawerRef={ref} accountId={account?.id} view={view} />,
      { size: '640px' },
    )
  }

  const confirmDelete = (account: IAccountMaster) => {
    const ref = modal.open<boolean>(
      (modalRef) => (
        <LUIConfirmDialog
          modalRef={modalRef}
          data={{
            title: 'Delete Account',
            message: `Are you sure you want to delete "${account.account_name}"? This cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: () =>
              deleteAccountMaster.mutateAsync(account.id).catch((error) => {
                notify.error('Delete Failed', getErrorMessage(error))
                throw error
              }),
          }}
        />
      ),
      { width: '420px' },
    )

    void ref.afterClosed().then((confirmed) => {
      if (confirmed) notify.success('Account Deleted', `"${account.account_name}" has been removed.`)
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

        {canCreate && <LUIButton onClick={() => openForm()}>Add Account</LUIButton>}
      </LUIFlex>

      <LUICard className="table-card">
        <LUITable
          columns={columns}
          data={accounts}
          rowKey="id"
          serverSort
          sort={sort}
          onSortChange={onSortChange}
          loading={isFetching}
          emptyText="No accounts found"
        >
          <LUITableCell<IAccountMaster> column="sn">
            {({ index }) => pageIndex * pageSize + index + 1}
          </LUITableCell>

          <LUITableCell<IAccountMaster> column="isActive">
            {({ row }) => (
              <LUIChip variant={row.is_active ? 'success' : 'error'} dot>
                {row.is_active ? 'Active' : 'Inactive'}
              </LUIChip>
            )}
          </LUITableCell>

          <LUITableCell<IAccountMaster> column="actions">
            {({ row }) => (
              <LUIFlex justify="center" gap="small">
                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`View ${row.account_name}`}
                  onClick={() => openForm(row, true)}
                >
                  <LUIIcon name="eye" size={16} />
                </LUIButton>

                {canEdit && !row.is_system_generated && (
                  <LUIButton
                    variant="outlined"
                    size="sm"
                    rounded
                    aria-label={`Edit ${row.account_name}`}
                    onClick={() => openForm(row)}
                  >
                    <LUIIcon name="edit" size={16} />
                  </LUIButton>
                )}

                {canDelete && !row.is_system_generated && row.deletable && (
                  <LUIButton
                    variant="outlined"
                    size="sm"
                    rounded
                    aria-label={`Delete ${row.account_name}`}
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

export default AccountMasterPage
