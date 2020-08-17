import memoize from 'memoizee'
import { initialize } from 'alcumus-behaviours'

const processLookup = memoize(
    function (id, document) {
        initialize(document)
        const [, questions] = document.sendMessage('allQuestions', 'all', [])
        let lookup = { _all: questions }
        for (let question of questions) {
            if (question.name) {
                lookup[question.name] = question
            }
            lookup[question.id] = question
        }
        return lookup
    },
    { maxAge: 3000, length: 1 }
)

export function lookup(document) {
    return processLookup(document._id, document)
}
