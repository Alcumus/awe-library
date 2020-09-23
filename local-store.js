import { raiseAsync } from 'common/events'
import { isDebugger } from 'common/debugger'

const prefix = isDebugger() ? 'debugger-' : ''

export async function storeLocalItem(key, value) {
    await raiseAsync('local-store-setItem', `${prefix}${key}`, value)
}

export async function getLocalItem(key, defaultValue) {
    const context = {key:`${prefix}${key}`, defaultValue}
    await raiseAsync('local-store-getItem', context)
    return context.value || defaultValue
}

export async function removeLocalItem(key) {
    await raiseAsync('local-store-removeItem', `${prefix}${key}`)
}
