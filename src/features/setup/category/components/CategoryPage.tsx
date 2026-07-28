import { LUIButton, LUIFilter, LUIFlex, LUITable } from "@/components"

const CategoryPage = () => {
  return (
    <>
      <LUIFlex justify="space-between" align="center">
        <LUIFilter searchBy="name" ></LUIFilter>

        <LUIButton>Add Category</LUIButton>
      </LUIFlex>

      <div className="section">
        {/* <LUITable columns={}></LUITable> */}
      </div>
    </>
  )
}

export default CategoryPage
