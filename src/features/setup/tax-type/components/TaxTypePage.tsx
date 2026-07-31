import { LUITableCell, type TableColumn } from '@/components'
import { MasterListPage, type IMasterEntity } from '../../shared'

const columns: TableColumn[] = [
  { key: 'sn', header: 'S.N.', width: '70px' },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'tax_rate', header: 'Tax Rate', width: '120px', align: 'right', sortable: true },
  { key: 'is_active', header: 'Status', width: '120px', align: 'center' },
  { key: 'actions', header: 'Actions', width: '110px', align: 'center' },
]

const TaxTypePage = () => (
  <MasterListPage title="Tax Type" endpoint="/master/taxtypes" columns={columns} withTaxRate>
    <LUITableCell<IMasterEntity> column="tax_rate">
      {({ row }) => `${row.tax_rate ?? 0}%`}
    </LUITableCell>
  </MasterListPage>
)

export default TaxTypePage
