import { LUIButton, LUIFilter, LUIFlex } from "@/components"

const CategoryPage = () => {
  return (
    <>
      <LUIFlex justify="space-between" align="center">
        <LUIFilter searchBy="name" ></LUIFilter>

        <LUIButton>Add Category</LUIButton>
      </LUIFlex>

      <div className="section">

      </div>
    </>
  )
}

export default CategoryPage
