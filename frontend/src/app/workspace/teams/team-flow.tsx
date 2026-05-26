"use client"

import React, { useCallback, useState } from "react"
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Panel,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react"

import "@xyflow/react/dist/style.css"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PencilIcon, UserPlusIcon, Trash2Icon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

// Custom Node Component
type TeamMemberNodeData = {
  name: string
  role: string
  avatar?: string
  department: string
  status: "active" | "away" | "offline"
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

type TeamMemberNode = Node<TeamMemberNodeData, "member">

const TeamMemberNodeComponent = ({
  id,
  data,
}: NodeProps<TeamMemberNode>) => {
  const statusColors = {
    active: "bg-emerald-500",
    away: "bg-emerald-500",
    offline: "bg-slate-300",
  }

  return (
    <div className="relative group flex items-center gap-4 p-3 rounded-xl border bg-card text-card-foreground  hover: transition-all w-[260px] h-[80px] border-l-4 border-l-emerald-500">
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2 border-0" />
      
      <div className="relative shrink-0">
        <Avatar className="size-12 border-2 border-background ">
          <AvatarImage src={data.avatar} />
          <AvatarFallback className="bg-slate-50 text-slate-700 font-bold text-xs">
            {data.name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        <div className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background", statusColors[data.status])} />
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <h4 className="text-sm font-bold truncate leading-tight">{data.name}</h4>
        <p className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider mb-1">{data.role}</p>
        <Badge variant="outline" className="text-[9px] h-4 w-fit px-1.5 bg-muted/30 font-normal">
          {data.department}
        </Badge>
      </div>

      <div className="absolute top-2 right-2 flex gap-1">
        <Button 
          variant="ghost" 
          size="icon-sm" 
          className="size-6 bg-background/80 border "
          onClick={() => data.onEdit?.(id)}
        >
          < PencilIcon className="size-3 text-muted-foreground" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon-sm" 
          className="size-6 bg-background/80 border  hover:text-destructive"
          onClick={() => data.onDelete?.(id)}
        >
          <Trash2Icon className="size-3" />
        </Button>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2 border-0" />
    </div>
  )
}

const nodeTypes: any = {
  member: TeamMemberNodeComponent,
}

const initialNodes: TeamMemberNode[] = [
  {
    id: "1",
    type: "member",
    position: { x: 400, y: 0 },
    data: {
      name: "Amarnath Am",
      role: "Department Head",
      department: "Engineering",
      status: "active",
    },
  },
  {
    id: "2",
    type: "member",
    position: { x: 100, y: 150 },
    data: {
      name: "Sarah Chen",
      role: "Lead Developer",
      department: "Frontend",
      status: "active",
    },
  },
  {
    id: "3",
    type: "member",
    position: { x: 400, y: 150 },
    data: {
      name: "Michael Ross",
      role: "Product Manager",
      department: "Product",
      status: "away",
    },
  },
  {
    id: "4",
    type: "member",
    position: { x: 700, y: 150 },
    data: {
      name: "Elena Rodriguez",
      role: "Design Lead",
      department: "UI/UX",
      status: "active",
    },
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3", animated: true },
  { id: "e1-4", source: "1", target: "4", animated: true },
]

const availableUsers = [
  { id: "u1", name: "David Kim", role: "Senior Engineer", department: "Frontend", status: "active" },
  { id: "u2", name: "Lisa Wang", role: "Junior Developer", department: "Frontend", status: "active" },
  { id: "u3", name: "James Wilson", role: "Backend Lead", department: "Engineering", status: "active" },
  { id: "u4", name: "Emma Thompson", role: "UX Researcher", department: "UI/UX", status: "away" },
  { id: "u5", name: "Ryan Garcia", role: "DevOps Engineer", department: "Engineering", status: "offline" },
]

export function TeamFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [editingNode, setEditingNode] = useState<TeamMemberNode | null>(null)
  const [isAddingMember, setIsAddingMember] = useState(false)

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleEdit = useCallback((id: string) => {
    const node = nodes.find((n) => n.id === id) as TeamMemberNode
    if (node) setEditingNode(node)
  }, [nodes])

  const handleDelete = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id))
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
  }, [setNodes, setEdges])

  const handleSaveNode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingNode) return

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const role = formData.get("role") as string
    const department = formData.get("department") as string

    setNodes((nds) =>
      nds.map((n) =>
        n.id === editingNode.id
          ? { ...n, data: { ...n.data, name, role, department } }
          : n
      )
    )
    setEditingNode(null)
  }

  const handleAddUserToFlow = (user: typeof availableUsers[0]) => {
    const newNode: TeamMemberNode = {
      id: `node-${user.id}-${Date.now()}`,
      type: "member",
      position: { x: Math.random() * 400, y: Math.random() * 300 + 100 },
      data: {
        name: user.name,
        role: user.role,
        department: user.department,
        status: user.status as any,
      },
    }
    setNodes((nds) => [...nds, newNode])
    setIsAddingMember(false)
  }

  // Inject handlers into nodes
  const nodesWithHandlers = React.useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      data: { ...n.data, onEdit: handleEdit, onDelete: handleDelete },
    }))
  }, [nodes, handleEdit, handleDelete])

  return (
    <div className="w-full h-full bg-muted/5 overflow-hidden">
      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap 
          nodeColor="#10b981"
          maskColor="rgba(0, 0, 0, 0.05)"
          className="rounded-lg border "
        />
        <Panel position="top-right" className="flex gap-2">
          <Button 
            size="sm" 
            className="bg-emerald-600 hover:bg-emerald-700 "
            onClick={() => setIsAddingMember(true)}
          >
            <UserPlusIcon className="mr-2 size-4" />
            Add Member
          </Button>
        </Panel>
      </ReactFlow>

      {/* Edit Dialog */}
      <Dialog open={!!editingNode} onOpenChange={(open) => !open && setEditingNode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveNode} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" defaultValue={editingNode?.data.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role / Designation</Label>
              <Input id="role" name="role" defaultValue={editingNode?.data.role} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" defaultValue={editingNode?.data.department} required />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingNode(null)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Member Selection Dialog */}
      <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select a user from the directory to add them to this team flow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {availableUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-emerald-50/30 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border ">
                        <AvatarFallback className="bg-slate-50 text-slate-700 font-bold text-xs">
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{user.role}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="size-8 p-0 border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                      onClick={() => handleAddUserToFlow(user)}
                    >
                      <CheckIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddingMember(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
