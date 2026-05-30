import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Check, X, Loader2, Gift, Clock } from 'lucide-react'
import { createSimpleTask, getAvailableTasks, getAdminWithdrawals } from '../../lib/api'
import { reviewTaskSubmission } from '../../lib/api'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { formatNumber, timeAgo } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  // Create task form
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskType, setTaskType] = useState('VISIT_URL')
  const [proofType, setProofType] = useState('URL')
  const [proofInstructions, setProofInstructions] = useState('')
  const [rewardCoins, setRewardCoins] = useState(1000)
  const [maxSubmissions, setMaxSubmissions] = useState(0)

  // Review
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const t = await getAvailableTasks()
      setTasks(t || [])
      // For demo, we'll show empty submissions
      setSubmissions([])
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!taskTitle || !taskDescription || rewardCoins <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreateLoading(true)
    try {
      await createSimpleTask({
        title: taskTitle,
        description: taskDescription,
        task_type: taskType,
        proof_type: proofType,
        proof_instructions: proofInstructions,
        reward_coins: rewardCoins,
        max_submissions: maxSubmissions,
      })
      toast.success('Task created successfully!')
      setShowCreateModal(false)
      setTaskTitle('')
      setTaskDescription('')
      setRewardCoins(1000)
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleReview = async (action: 'approve' | 'reject') => {
    if (!selectedSubmission) return

    setReviewLoading(true)
    try {
      await reviewTaskSubmission(selectedSubmission.id, action, reviewNotes)
      toast.success(`Submission ${action}d`)
      setShowReviewModal(false)
      setSelectedSubmission(null)
      setReviewNotes('')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to review submission')
    } finally {
      setReviewLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Task Management</h1>
          <p className="text-slate-400">Create tasks and review submissions</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-5 h-5" />
          Create Task
        </Button>
      </div>

      {/* Pending Submissions */}
      {submissions.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white font-display mb-4">Pending Submissions</h2>
          <div className="space-y-3">
            {submissions.map((sub: any) => (
              <div key={sub.id} className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{sub.task?.title}</p>
                    <p className="text-sm text-slate-400">By: {sub.user?.username}</p>
                    {sub.proof_url && (
                      <a href={sub.proof_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-400 hover:underline">
                        View Proof
                      </a>
                    )}
                    {sub.proof_text && (
                      <p className="text-sm text-slate-300 mt-2">{sub.proof_text}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSubmission(sub)
                        setShowReviewModal(true)
                      }}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Tasks */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white font-display mb-4">Active Tasks</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-accent-400 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tasks yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-800/50 rounded-lg"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-white">{task.title}</h3>
                  <span className="text-gold-400 font-bold">{formatNumber(task.reward_coins)}</span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{task.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{task.task_type}</span>
                  <span>Proof: {task.proof_type}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="badge badge-info">{task.current_submissions} submissions</span>
                  {task.max_submissions > 0 && (
                    <span className="text-xs text-slate-400">Max: {task.max_submissions}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setTaskTitle('')
          setTaskDescription('')
        }}
        title="Create Task"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            placeholder="Enter task title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
            <textarea
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[100px]"
              placeholder="Enter task description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Task Type</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white"
              >
                <option value="VISIT_URL">Visit URL</option>
                <option value="RETWEET">Retweet</option>
                <option value="JOIN_TELEGRAM">Join Telegram</option>
                <option value="JOIN_DISCORD">Join Discord</option>
                <option value="FOLLOW_SOCIAL">Follow Social</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Proof Type</label>
              <select
                value={proofType}
                onChange={(e) => setProofType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-white"
              >
                <option value="URL">URL</option>
                <option value="TEXT">Text</option>
                <option value="IMAGE">Image</option>
                <option value="NONE">None</option>
              </select>
            </div>
          </div>

          <Input
            label="Proof Instructions"
            placeholder="Instructions for users on how to complete this task"
            value={proofInstructions}
            onChange={(e) => setProofInstructions(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Reward (coins)"
              type="number"
              value={rewardCoins}
              onChange={(e) => setRewardCoins(parseInt(e.target.value) || 0)}
            />
            <Input
              label="Max Submissions (0 = unlimited)"
              type="number"
              value={maxSubmissions}
              onChange={(e) => setMaxSubmissions(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCreateTask}
              loading={createLoading}
            >
              Create Task
            </Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false)
          setSelectedSubmission(null)
          setReviewNotes('')
        }}
        title="Review Submission"
      >
        {selectedSubmission && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400">Task</p>
              <p className="text-lg font-bold text-white">{selectedSubmission.task?.title}</p>
              <p className="text-gold-400">{formatNumber(selectedSubmission.task?.reward_coins)} coins reward</p>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Proof</p>
              {selectedSubmission.proof_url && (
                <a
                  href={selectedSubmission.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:underline"
                >
                  {selectedSubmission.proof_url}
                </a>
              )}
              {selectedSubmission.proof_text && (
                <p className="text-white">{selectedSubmission.proof_text}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Review Notes (optional)</label>
              <textarea
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 min-h-[80px]"
                placeholder="Add notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => handleReview('reject')}
                loading={reviewLoading}
              >
                <X className="w-5 h-5" />
                Reject
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => handleReview('approve')}
                loading={reviewLoading}
              >
                <Check className="w-5 h-5" />
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
