const channels = new Map()

export const openChanel = (name) => {
  channels.set(name, new BroadcastChannel(name))

  const channel = channels.get(name)

  return {
    name,
    channel
  }
}

export const closeChanel = (name) => {
  const channel = channels.get(name)

  if (channel) {
    channel.close()
    channels.delete(name)
  }
}
