import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
} from '@workspace/ui/components/sidebar'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@workspace/ui/components/collapsible'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@workspace/ui/components/dropdown-menu'
import { ChevronDown, ChevronUp, Key, LogOut, LucideLayoutDashboard, LucidePlus, PlusCircle, User2, WorkflowIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
// import { createWorkflow, getAllCredentials, getAllWorkflows, getworkflowData } from '@/app/workflow/lib/config'
import { useAppDispatch, useAppSelector } from '@/app/hooks/redux'
import { userAction } from '@/store/slices/userSlice'
import { workflowActions } from '@/store/slices/workflowSlice'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { api } from '@/app/lib/api'
import { CardDemo } from './Design/WorkflowCard'

export function AppSidebar() {

  const user = useAppSelector((s)=> s.user)
  const flow = useAppSelector(s=>s.workflow) // workflow
  console.log('redux workflow from sidebar: ',flow)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const reduxWorkflowId = flow.data.workflowId
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null >(reduxWorkflowId)
  type WorkflowSummary = { id: string; name: string; description?: string | null }
  const [workflows, setWorkflows] = useState<WorkflowSummary[] | undefined>()
  const [creds, setCreds] = useState<Array<any>>()
  const [createOpen, setCreateOpen] = useState(false);
  
  useEffect(()=>{
    
    async function getWorkflows(){
          const flows = await api.workflows.getAll();
          if(flows) setWorkflows(flows.data.Data)
      }

    async function getCreds(){
        const credentials = await api.Credentials.getAllCreds();
        console.log(`--- 60 ${JSON.stringify(credentials)}`)
        if(credentials.data) setCreds(credentials.data.data)
    }

    async function getWorkflowData(){
      if(!selectedWorkflow) return
      const workflow = await api.workflows.get(selectedWorkflow);
      if(workflow.data){
        console.log("workflow data fetchedsuceesully: ", workflow.data.Data)
        // dispatch(workflowActions.addWorkflowNode(workflow.data.nodes))
        dispatch(
          workflowActions.setWorkflowFromBackend({
            workflowId: selectedWorkflow,
            data: workflow.data.Data,
          })
        )
        // dispatch(workflowActions.setWorkflowTrigger(workflow.data.Trigger))
        // console.log(`workfklow from redux: ${workflow.data}`)
      }
    }
    if(!creds) getCreds()
    if(!workflows) {
      getWorkflows()
    }
    getWorkflowData()
  },[selectedWorkflow, dispatch])
  
  const workflowHandler = (workflow: WorkflowSummary) => {
    setSelectedWorkflow(workflow.id)
    router.push(`/workflows/${workflow.id}`)
  }
  const credHandler = (cId: string)=> {
    // console.log(cId);
    
  }
  const logout = async()=>{
    toast.info("Logging out...")
    await signOut({redirect: false})
    dispatch(userAction.clearUser())
    dispatch(workflowActions.clearWorkflow())
    router.push('/login')
  }

//   console.log(`workflow form ${workflow}`)
  return (
    <>
    <Sidebar collapsible='icon'>
      <SidebarHeader className='flex items-center justify-between p-4'>
        <span className='text-2xl font-bold'>Logo</span>
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent className='p-2'>
        <SidebarMenu>

          <SidebarMenuItem>
              <SidebarMenuButton className='text-xl font-bold text-white h-14' onClick={()=> setCreateOpen(true)}>
                  <LucidePlus className='my-2'/> Create Workflow
              </SidebarMenuButton>
          </SidebarMenuItem>

            {/* WORKFLOWS LIST */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <WorkflowIcon className='my-1'/>
                  <span>Workflows</span>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="max-h-64 overflow-y-auto cursor-pointer">
                  {workflows ? (workflows.length === 0 ? (
                    <SidebarMenuSubItem key={0}>
                      <SidebarMenuSubButton>
                        <span>Create Workflow</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : (workflows.map((i) => (
                    <SidebarMenuSubItem onClick={()=>workflowHandler(i)} key={i.id}>
                      <SidebarMenuSubButton isActive={selectedWorkflow === i.id}>
                        <span>{i.name}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>)
                  ))) : (<span>Loading...</span>
                  )
                }
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
            {/* CREDENTIALS LIST */}
          <Collapsible  className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <Key className='my-2'/>
                  <span>Credentials</span>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="max-h-32 overflow-y-auto cursor-pointer">
                  {creds ? (creds.length === 0 ? 
                            (<SidebarMenuSubItem key={0}>
                                <SidebarMenuSubButton>
                                    <span>No credentials avaliable</span>
                                </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ) : creds.map((i:any) => (
                    <SidebarMenuSubItem key={i.id}>
                      <SidebarMenuSubButton>
                        <span>credential - {i.type}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))) : (
                    <SidebarMenuSubItem key={0}>
                      <SidebarMenuSubButton>
                        <span>Loading...</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )
                }
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarContent>
     
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className='h-auto'>
                    <User2 /> 
                    <div className='flex flex-col'>
                    <p className='font-bold'>{user.name}</p>
                    <p className='font-light'>
                    {user.email}
                    </p>
                    </div>
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width] flex gap-1 justify-between"
                >
                  <DropdownMenuItem>
                    <span >Dashboard</span>
                    <LucideLayoutDashboard className='text-white'/>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className='bg-red-600 hover:bg-red-400'>
                    <span>Sign out</span>
                    <LogOut className='text-white'/>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
							{ createOpen && <CardDemo onClose={() => setCreateOpen(false)}/>}
    </>
  )
}