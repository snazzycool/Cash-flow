import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Video, Target, ExternalLink, AlertCircle, CheckCircle, Clock, Gift, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store'
import { formatNumber } from '../lib/utils'
import { getAvailableTasks, getTaskSubmissions, submitTaskProof, watchAd, getAdWatchStatus, getAllConfigs } from '../lib/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import toast from 'react-hot-toast'
import type { SimpleTask, TaskSubmission } from '../lib/supabase'

export default function EarnPage() {
  const { user } = useAuthStore()
  const [configs, setConfigs] = useState<Record<string, number>>({})
  const [tasks, setTasks] = useState<SimpleTask[]>([])
  const [submissions, setSubmissions] = useState<(TaskSubmission & { task: SimpleTask })[]>([])
  const [adsWatched, setAdsWatched] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adLoading, setAdLoading] = useState(false)
  const [selectedTask, setSelectedTask] = useState<SimpleTask | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [proofText, setProofText] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [c, t, s, a] = await Promise.all([
        getAllConfigs(),
        getAvailableTasks(),
        getTaskSubmissions(),
        getAdWatchStatus(),
      ])
      setConfigs(c)
      setTasks(t)
      setSubmissions(s as any[])
      setAdsWatched(a?.length || 0)
    } catch (error) {
      console.error('Error loading earn data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWatchAd = async () => {
    setAdLoading(true)
    try {
      const result = await watchAd()
      toast.success(`Earned ${result.coins_awarded} coins!`)
      setAdsWatched((prev) => prev + 1)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || 'Failed to watch ad')
    } finally {
      setAdLoading(false)
    }
  }

  const handleSubmitTask = async () => {
    if (!selectedTask) return

    setSubmitLoading(true)
    try {
      await submitTaskProof(selectedTask.id, proofUrl, proofText)
      toast.success('Task submitted for review!')
      setSelectedTask(null)
      setProofUrl('')
      setProofText('')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit task')
    } finally {
      setSubmitLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-primary-400" />
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-gold-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Earn Coins</h1>
          <p className="text-slate-400">Complete tasks and watch ads to earn coins</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-lg">
          <Gift className="w-5 h-5 text-gold-400" />
          <span className="text-white font-medium">{formatNumber(user?.coins || 0)} coins</span>
        </div>
      </div>

      {/* Watch Ads Section */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
              <Video className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Watch Ads</h2>
              <p className="text-slate-400">
                Earn {configs.ad_reward_min}-{configs.ad_reward_max} coins per ad
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{adsWatched}/{configs.max_daily_ads}</p>
              <p className="text-sm text-slate-500">ads watched today</p>
            </div>
            <Button
              variant="gold"
              onClick={handleWatchAd}
              loading={adLoading}
              disabled={adsWatched >= configs.max_daily_ads}
            >
              Watch Ad
            </Button>
          </div>
        </div>
        {adsWatched >= configs.max_daily_ads && (
          <div className="mt-4 p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg text-gold-400 text-sm">
            You've reached your daily ad limit. Come back tomorrow!
          </div>
        )}
      </Card>

      {/* Available Tasks */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-white font-display mb-4">Available Tasks</h2>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tasks available at the moment</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary-400" />
                  </div>
                  <span className="text-gold-400 font-bold">{formatNumber(task.reward_coins)}</span>
                </div>
                <h3 className="font-medium text-white mb-1">{task.title}</h3>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{task.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedTask(task)}
                >
                  Complete Task
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* My Submissions */}
      {submissions.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white font-display mb-4">My Submissions</h2>
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(submission.status)}
                  <div>
                    <p className="font-medium text-white">{(submission.task as any)?.title}</p>
                    <p className="text-sm text-slate-400">
                      Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge ${
                    submission.status === 'approved' ? 'badge-success' :
                    submission.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {submission.status}
                  </span>
                  {submission.coins_awarded > 0 && (
                    <p className="text-gold-400 font-medium mt-1">
                      +{submission.coins_awarded} coins
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Task Submission Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => {
          setSelectedTask(null)
          setProofUrl('')
          setProofText('')
        }}
        title={selectedTask?.title}
        maxWidth="lg"
      >
        {selectedTask && (
          <div className="space-y-4">
            <p className="text-slate-400">{selectedTask.description}</p>

            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Reward:</p>
              <p className="text-2xl font-bold text-gold-400">{formatNumber(selectedTask.reward_coins)} coins</p>
            </div>

            {selectedTask.proof_instructions && (
              <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                <p className="text-sm text-primary-300">{selectedTask.proof_instructions}</p>
              </div>
            )}

            {selectedTask.proof_type === 'URL' && (
              <Input
                label="Proof URL"
                placeholder="Enter the URL as proof"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
            )}

            {selectedTask.proof_type === 'TEXT' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Proof Text</label>
                <textarea
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[100px]"
                  placeholder="Enter your proof text"
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  setSelectedTask(null)
                  setProofUrl('')
                  setProofText('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSubmitTask}
                loading={submitLoading}
                disabled={
                  (selectedTask.proof_type === 'URL' && !proofUrl) ||
                  (selectedTask.proof_type === 'TEXT' && !proofText)
                }
              >
                Submit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
