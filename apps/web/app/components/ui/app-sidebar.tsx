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
import { ChevronDown, ChevronUp, Key, LogOut, LucideLayoutDashboard, PlusCircle, User2, WorkflowIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createWorkflow, getAllCredentials, getAllWorkflows, getEmptyWorkflow } from '@/app/workflow/lib/config'
import { useAppDispatch, useAppSelector } from '@/app/hooks/redux'
import { userAction } from '@/store/slices/userSlice'
import { workflowActions } from '@/store/slices/workflowSlice'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function AppSidebar() {

  const user = useAppSelector((s)=> s.user)
  const flow = useAppSelector(s=>s.workflow) // workflow
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null >(flow.workflow_id)
  const [workflow, setWorkflow] = useState<Array<any>>()
  const [creds, setCreds] = useState<Array<any>>()
  useEffect(()=>{
    async function getWorkflows(){
        const flows = await getAllWorkflows();
        if(flows) setWorkflow(flows)
    }

    async function getCreds(){
        const credentials = await getAllCredentials();
        if(credentials) setCreds(credentials)
    }

    if(!creds) getCreds()
    if(!workflow) getWorkflows()
  },[selectedWorkflow])
  
  const workflowHandler = (wId: string)=>{
    dispatch(workflowActions.setWorkflowId(wId))
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

  const createNewWorkflow = async()=>{
    const workflow = await getEmptyWorkflow()
          
        if(workflow){
        const {id, isEmpty} = workflow
        dispatch(workflowActions.setWorkflowId(id))
        dispatch(workflowActions.setWorkflowStatus(isEmpty))
        toast.info("You are in empty workflow")
        }
        else{
            const newWorkflow = await createWorkflow()
            dispatch(workflowActions.clearWorkflow())
            setSelectedWorkflow(null)
            dispatch(workflowActions.setWorkflowId(newWorkflow.id))
            dispatch(workflowActions.setWorkflowStatus(newWorkflow.isEmpty))
            toast.success("Workflow created")
        }
    }
//   console.log(`workflow form ${workflow}`)
  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='flex items-center justify-between p-4'>
        <span className='text-2xl font-bold'>Logo</span>
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>

                <SidebarMenuItem>
                    <SidebarMenuButton className='text-xl font-bold text-white h-14' onClick={createNewWorkflow}>
                        <PlusCircle className='m-2'/> Create Workflow
                    </SidebarMenuButton>
                </SidebarMenuItem>

            {/* WORKFLOWS LIST */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <WorkflowIcon className='m-2'/>
                  <span>Workflows</span>
                  <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub className="max-h-64 overflow-y-auto cursor-pointer">
                  {workflow ? (workflow.length === 0 ? (
                    <SidebarMenuSubItem key={0}>
                      <SidebarMenuSubButton>
                        <span>Create Workflow</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ) : (workflow.map((i:any) => (
                    <SidebarMenuSubItem onClick={()=>workflowHandler(i.id)} key={i.id}>
                      <SidebarMenuSubButton isActive={flow.workflow_id === i.id}>
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
                  <Key className='m-2'/>
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
  )
}