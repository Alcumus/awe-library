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

export async function usingLocalItem(key, fn, defaultValue) {
    let item = await getLocalItem(key)
    item = item ? item : JSON.parse(JSON.stringify(defaultValue))
    let result = await Promise.resolve(fn(item))
    item = result || item
    if (Object.isEqual(item, defaultValue)) {
        await removeLocalItem(key)
    } else {
        item && (await storeLocalItem(key, item))
    }
}
