'use client'

import { useState } from 'react'
import type { WaiverWithContext } from '@/lib/db/waivers'

type Group = { key: string; date: string; title: string; waivers: WaiverWithContext[] }

export default function WaiverManager({ groups }: { groups: Group[] }) {
  const [removed, setRemoved] = useState<Record<string, boolean>>({})

  // Resend
  const [resending, setResending] = useState<Record<string, boolean>>({})
  const [resendMsg, setResendMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  // Mark as signed
  const [markOpen, setMarkOpen] = useState<Record<string, boolean>>({})
  const [markName, setMarkName] = useState<Record<string, string>>({})
  const [markEmail, setMarkEmail] = useState<Record<string, string>>({})
  const [markDob, setMarkDob] = useState<Record<string, string>>({})
  const [marking, setMarking] = useState<Record<string, boolean>>({})
  const [markMsg, setMarkMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  // Edit
  const [editOpen, setEditOpen] = useState<Record<string, boolean>>({})
  const [editName, setEditName] = useState<Record<string, string>>({})
  const [editEmail, setEditEmail] = useState<Record<string, string>>({})
  const [editDob, setEditDob] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [editMsg, setEditMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  // Delete
  const [confirmDelete, setConfirmDelete] = useState<Record<string, boolean>>({})
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [deleteMsg, setDeleteMsg] = useState<Record<string, { text: string; ok: boolean }>>({})

  async function handleResend(id: string, token: string, email: string, name: string | null) {
    setResending(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch('/api/admin/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend', waiver_token: token, email, name: name ?? undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResendMsg(p => ({ ...p, [id]: { text: typeof json.error === 'string' ? json.error : 'Error', ok: false } }))
      } else {
        setResendMsg(p => ({ ...p, [id]: { text: 'Sent ✓', ok: true } }))
        setTimeout(() => setResendMsg(p => ({ ...p, [id]: { text: '', ok: true } })), 3000)
      }
    } catch {
      setResendMsg(p => ({ ...p, [id]: { text: 'Network error', ok: false } }))
    } finally {
      setResending(p => ({ ...p, [id]: false }))
    }
  }

  async function handleMarkSigned(id: string) {
    setMarking(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch('/api/admin/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_signed',
          waiver_id: id,
          name: markName[id]?.trim() || undefined,
          email: markEmail[id]?.trim() || undefined,
          dob: markDob[id]?.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMarkMsg(p => ({ ...p, [id]: { text: typeof json.error === 'string' ? json.error : 'Error', ok: false } }))
      } else {
        setMarkMsg(p => ({ ...p, [id]: { text: 'Marked as signed ✓ Refresh to see it.', ok: true } }))
        setMarkOpen(p => ({ ...p, [id]: false }))
      }
    } catch {
      setMarkMsg(p => ({ ...p, [id]: { text: 'Network error', ok: false } }))
    } finally {
      setMarking(p => ({ ...p, [id]: false }))
    }
  }

  async function handleEdit(id: string) {
    setEditing(p => ({ ...p, [id]: true }))
    try {
      const res = await fetch('/api/admin/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          waiver_id: id,
          name: editName[id]?.trim() || undefined,
          email: editEmail[id]?.trim() || undefined,
          dob: editDob[id]?.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setEditMsg(p => ({ ...p, [id]: { text: typeof json.error === 'string' ? json.error : 'Error', ok: false } }))
      } else {
        setEditMsg(p => ({ ...p, [id]: { text: 'Saved ✓ Refresh to see it.', ok: true } }))
        setEditOpen(p => ({ ...p, [id]: false }))
      }
    } catch {
      setEditMsg(p => ({ ...p, [id]: { text: 'Network error', ok: false } }))
    } finally {
      setEditing(p => ({ ...p, [id]: false }))
    }
  }

  async function handleDelete(id: string) {
    setDeleting(p => ({ ...p, [id]: true }))
    setConfirmDelete(p => ({ ...p, [id]: false }))
    try {
      const res = await fetch('/api/admin/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', waiver_id: id }),
      })
      const json = await res.json()
      if (!res.ok) {
        setDeleteMsg(p => ({ ...p, [id]: { text: typeof json.error === 'string' ? json.error : 'Error', ok: false } }))
      } else {
        setRemoved(p => ({ ...p, [id]: true }))
      }
    } catch {
      setDeleteMsg(p => ({ ...p, [id]: { text: 'Network error', ok: false } }))
    } finally {
      setDeleting(p => ({ ...p, [id]: false }))
    }
  }

  function DeleteControl({ id }: { id: string }) {
    if (deleteMsg[id]?.text) {
      return <span className="text-xs text-red-600">{deleteMsg[id].text}</span>
    }
    if (confirmDelete[id]) {
      return (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Delete?</span>
          <button
            onClick={() => handleDelete(id)}
            disabled={deleting[id]}
            className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting[id] ? '…' : 'Yes'}
          </button>
          <button
            onClick={() => setConfirmDelete(p => ({ ...p, [id]: false }))}
            className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-800"
          >
            No
          </button>
        </div>
      )
    }
    return (
      <button
        onClick={() => setConfirmDelete(p => ({ ...p, [id]: true }))}
        className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
      >
        Delete
      </button>
    )
  }

  return (
    <div className="space-y-8">
      {groups.map(group => {
        const visible = group.waivers.filter(w => !removed[w.id])
        const signed = visible.filter(w => w.signed_at)
        const outstanding = visible.filter(w => !w.signed_at)
        if (visible.length === 0) return null

        return (
          <div key={group.key} className="border rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-1">{group.title}</h2>
            <p className="text-sm text-gray-500 mb-4">{group.date}</p>

            {outstanding.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Outstanding</p>
                <table className="w-full text-sm mb-2">
                  <thead><tr className="text-left text-gray-500">
                    <th className="pb-2">Booking</th><th className="pb-2"></th>
                  </tr></thead>
                  <tbody>
                    {outstanding.map(w => (
                      <tr key={w.id} className="border-t align-top">
                        <td className="py-2">{w.booking_name ?? w.booking_email ?? 'Walk-in'}</td>
                        <td className="py-2 text-right">
                          {!markOpen[w.id] ? (
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {resendMsg[w.id]?.text && (
                                <span className={`text-xs ${resendMsg[w.id].ok ? 'text-green-600' : 'text-red-600'}`}>{resendMsg[w.id].text}</span>
                              )}
                              {markMsg[w.id]?.text && (
                                <span className={`text-xs ${markMsg[w.id].ok ? 'text-green-600' : 'text-red-600'}`}>{markMsg[w.id].text}</span>
                              )}
                              <button
                                onClick={() => handleResend(w.id, w.token, w.booking_email ?? w.email ?? '', w.booking_name ?? w.name)}
                                disabled={resending[w.id]}
                                className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 hover:bg-orange-200 disabled:opacity-50"
                              >
                                {resending[w.id] ? 'Sending…' : 'Resend'}
                              </button>
                              <button
                                onClick={() => setMarkOpen(p => ({ ...p, [w.id]: true }))}
                                className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200"
                              >
                                Mark as signed
                              </button>
                              <DeleteControl id={w.id} />
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex gap-2 flex-wrap justify-end">
                                <input placeholder="Name" value={markName[w.id] ?? ''} onChange={e => setMarkName(p => ({ ...p, [w.id]: e.target.value }))} className="text-xs border rounded px-2 py-1 w-28" />
                                <input placeholder="Email" value={markEmail[w.id] ?? ''} onChange={e => setMarkEmail(p => ({ ...p, [w.id]: e.target.value }))} className="text-xs border rounded px-2 py-1 w-36" />
                                <input placeholder="DOB" value={markDob[w.id] ?? ''} onChange={e => setMarkDob(p => ({ ...p, [w.id]: e.target.value }))} className="text-xs border rounded px-2 py-1 w-24" />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleMarkSigned(w.id)}
                                  disabled={marking[w.id]}
                                  className="text-xs px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  {marking[w.id] ? 'Saving…' : 'Confirm signed'}
                                </button>
                                <button
                                  onClick={() => setMarkOpen(p => ({ ...p, [w.id]: false }))}
                                  className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-800"
                                >
                                  Cancel
                                </button>
                              </div>
                              {markMsg[w.id]?.text && (
                                <span className={`text-xs ${markMsg[w.id].ok ? 'text-green-600' : 'text-red-600'}`}>{markMsg[w.id].text}</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {signed.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Signed at</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {signed.map(w => (
                    <tr key={w.id} className="border-t align-top">
                      {!editOpen[w.id] ? (
                        <>
                          <td className="py-2">{w.name}</td>
                          <td className="py-2">{w.email}</td>
                          <td className="py-2 text-gray-500">{new Date(w.signed_at!).toLocaleString('en-GB')}</td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {editMsg[w.id]?.text && (
                                <span className={`text-xs ${editMsg[w.id].ok ? 'text-green-600' : 'text-red-600'}`}>{editMsg[w.id].text}</span>
                              )}
                              <button
                                onClick={() => {
                                  setEditOpen(p => ({ ...p, [w.id]: true }))
                                  setEditName(p => ({ ...p, [w.id]: w.name ?? '' }))
                                  setEditEmail(p => ({ ...p, [w.id]: w.email ?? '' }))
                                  setEditDob(p => ({ ...p, [w.id]: w.dob ?? '' }))
                                }}
                                className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                Edit
                              </button>
                              <DeleteControl id={w.id} />
                            </div>
                          </td>
                        </>
                      ) : (
                        <td colSpan={4} className="py-2">
                          <div className="flex gap-2 flex-wrap items-center">
                            <input value={editName[w.id] ?? ''} onChange={e => setEditName(p => ({ ...p, [w.id]: e.target.value }))} className="text-xs border rounded px-2 py-1 w-32" placeholder="Name" />
                            <input value={editEmail[w.id] ?? ''} onChange={e => setEditEmail(p => ({ ...p, [w.id]: e.target.value }))} className="text-xs border rounded px-2 py-1 w-40" placeholder="Email" />
                            <input value={editDob[w.id] ?? ''} onChange={e => setEditDob(p => ({ ...p, [w.id]: e.target.value }))} className="text-xs border rounded px-2 py-1 w-24" placeholder="DOB" />
                            <button
                              onClick={() => handleEdit(w.id)}
                              disabled={editing[w.id]}
                              className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {editing[w.id] ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditOpen(p => ({ ...p, [w.id]: false }))}
                              className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
