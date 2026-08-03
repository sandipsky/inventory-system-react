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
import { useDropdown } from '@/services/dropdown.service'
import { useProductsList, useDeleteProducts } from '../products.query'
import type { IProducts } from '../products.types'
import ProductsForm from './ProductsForm'

const columns: TableColumn[] = [
  { key: 'sn', header: 'S.N.', width: '70px' },
  { key: 'name', header: 'Product Name', sortable: true },
  { key: 'code', header: 'Code', sortable: true },
  { key: 'category_name', header: 'Category', sortable: true },
  { key: 'product_types', header: 'Type' },
  { key: 'unit_name', header: 'Unit', sortable: true },
  { key: 'packing_name', header: 'Packing', sortable: true },
  { key: 'tax_type_name', header: 'Tax Type', sortable: true },
  { key: 'isActive', header: 'Status', width: '120px', align: 'center' },
  { key: 'actions', header: 'Actions', width: '110px', align: 'center' },
]

/* Server-side sort paths for columns whose row key differs from the API's sort field. */
const SORT_FIELDS: Record<string, string> = {
  category_name: 'category.name',
  unit_name: 'unit.name',
  packing_name: 'packing.name',
  tax_type_name: 'taxType.name',
}

const TYPE_OPTIONS = [
  { id: 'purchasable', name: 'Purchasable' },
  { id: 'sellable', name: 'Sellable' },
]

const STATUS_OPTIONS = [
  { id: '1', name: 'Active' },
  { id: '0', name: 'Inactive' },
]

const getErrorMessage = (error: unknown) =>
  isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
    : 'Something went wrong'

const ProductsPage = () => {
  const drawer = useLUIDrawer()
  const modal = useLUIModal()
  const notify = useLUINotification()

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<TableSort | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data: categories } = useDropdown('categorys')
  const { data: taxTypes } = useDropdown('taxtypes')
  const { data: packings } = useDropdown('packings')
  const { data: units } = useDropdown('units')

  const filterColumns: FilterColumn[] = [
    { name: 'Product Code', formcontrolName: 'code', type: 'text' },
    { name: 'Product Category', formcontrolName: 'category.id', type: 'select', data: categories ?? [] },
    { name: 'Unit', formcontrolName: 'unit.id', type: 'select', data: units ?? [] },
    { name: 'Packing', formcontrolName: 'packing.id', type: 'select', data: packings ?? [] },
    { name: 'Tax Type', formcontrolName: 'taxType.id', type: 'select', data: taxTypes ?? [] },
    { name: 'Type', formcontrolName: 'productType', type: 'select', data: TYPE_OPTIONS },
    { name: 'Status', formcontrolName: 'isActive', type: 'select', data: STATUS_OPTIONS },
  ]

  const { data, isFetching } = useProductsList({
    pageIndex,
    pageSize,
    ...(sort && { sort: `${SORT_FIELDS[sort.key] ?? sort.key}:${sort.direction}` }),
    ...filters,
  })
  const deleteProducts = useDeleteProducts()

  const products = data?.content ?? []
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

  const openForm = (product?: IProducts) => {
    drawer.open<boolean>((ref) => <ProductsForm drawerRef={ref} product={product} />, {
      size: '99vh',
      position: 'bottom',
    })
  }

  const confirmDelete = (product: IProducts) => {
    const ref = modal.open<boolean>(
      (modalRef) => (
        <LUIConfirmDialog
          modalRef={modalRef}
          data={{
            title: 'Delete Products',
            message: `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: () =>
              deleteProducts.mutateAsync(product.id).catch((error) => {
                notify.error('Delete Failed', getErrorMessage(error))
                throw error
              }),
          }}
        />
      ),
      { width: '420px' },
    )

    void ref.afterClosed().then((confirmed) => {
      if (confirmed) notify.success('Products Deleted', `"${product.name}" has been removed.`)
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

        <LUIButton onClick={() => openForm()}>Add Products</LUIButton>
      </LUIFlex>

      <LUICard className="table-card">
        <LUITable
          columns={columns}
          data={products}
          rowKey="id"
          serverSort
          sort={sort}
          onSortChange={onSortChange}
          loading={isFetching}
          emptyText="No products found"
        >
          <LUITableCell<IProducts> column="sn">
            {({ index }) => pageIndex * pageSize + index + 1}
          </LUITableCell>

          <LUITableCell<IProducts> column="product_types">
            {({ row }) => (
              <LUIFlex gap="small">
                {(row.product_types ?? []).map((type) => (
                  <LUIChip key={type}>{type}</LUIChip>
                ))}
              </LUIFlex>
            )}
          </LUITableCell>

          <LUITableCell<IProducts> column="isActive">
            {({ row }) => (
              <LUIChip variant={row.is_active ? 'success' : 'error'} dot>
                {row.is_active ? 'Active' : 'Inactive'}
              </LUIChip>
            )}
          </LUITableCell>

          <LUITableCell<IProducts> column="actions">
            {({ row }) => (
              <LUIFlex justify="center" gap="small">
                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`Edit ${row.name}`}
                  onClick={() => openForm(row)}
                >
                  <LUIIcon name='edit' size={16} />
                </LUIButton>

                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`Delete ${row.name}`}
                  onClick={() => confirmDelete(row)}
                >
                  <LUIIcon name='trash' size={16} />
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

export default ProductsPage
