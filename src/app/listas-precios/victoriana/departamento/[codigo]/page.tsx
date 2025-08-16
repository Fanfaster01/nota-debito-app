import DepartmentSection from '@/components/victoriana/DepartmentSection'

interface DynamicDepartmentProps {
  params: Promise<{
    codigo: string
  }>
}

export default async function DynamicDepartment({ params }: DynamicDepartmentProps) {
  const { codigo } = await params
  
  return (
    <DepartmentSection 
      departmentCode={codigo}
      departmentPath={`departamento/${codigo}`}
    />
  )
}