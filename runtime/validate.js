import events from 'alcumus-local-events'

export function validate(type, fn, prefix) {
    events.on(`${prefix ? `${prefix}.` : ''}awe.validate.question.${type}`, function (_, question, instance, errors) {
        try {
            fn.call(errors, question, instance, errors)
        } catch (e) {
            errors[question.name] = e.message
        }
    })
}
