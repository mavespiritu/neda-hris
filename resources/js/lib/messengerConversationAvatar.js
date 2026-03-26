export const resolveConversationAvatar = (conversation, safeUsers = [], meId = null, avatarUrl = (ipmsId) => ipmsId ? `/employees/image/${ipmsId}` : "") => {
  const directOtherUserId = Number(conversation?.other_user_id ?? 0)

  if (conversation?.type === "group" && Array.isArray(conversation?.participants) && conversation.participants.length) {
    return null
  }

  if (conversation?.other_user_avatar) {
    return conversation.other_user_avatar
  }

  if (conversation?.other_user_ipms_id) {
    return avatarUrl(conversation.other_user_ipms_id)
  }

  const fallbackUser = (safeUsers || []).find((user) => {
    if (user?.id == null) return false
    if (Number(user.id) !== directOtherUserId) return false
    if (meId != null && Number(user.id) === Number(meId)) return false
    return true
  })

  if (fallbackUser?.avatar) {
    return fallbackUser.avatar
  }

  if (fallbackUser?.ipms_id) {
    return avatarUrl(fallbackUser.ipms_id)
  }

  const participant = Array.isArray(conversation?.participants)
    ? conversation.participants.find((item) => Number(item?.id) !== Number(meId)) || conversation.participants[0]
    : null

  if (participant?.avatar) {
    return participant.avatar
  }

  if (participant?.ipms_id) {
    return avatarUrl(participant.ipms_id)
  }

  return "https://www.gravatar.com/avatar/?d=mp&s=200"
}
