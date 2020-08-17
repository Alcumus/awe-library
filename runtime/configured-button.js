import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import { AlcumusIcon } from 'common/icon-selector'
import { useButtonStyle } from './button-style'
import { useQuestionContext } from 'dynamic/awe-library/runtime/contexts'
import mobiscroll from '@mobiscroll/react'
import { makeStyles, Box } from '@material-ui/core'
import clsx from 'clsx'

export const useFormStyles = makeStyles(() => ({
    holderForm: {
        background: 'transparent !important',
        padding: 0,
        margin: 0,
        width: '100%',
    },
}))

export function ConfiguredButton({
    Component = Button,
    question,
    children,
    useForm = true,
    disabled,
    className,
    ...props
}) {
    const styles = useFormStyles()
    const currentQuestion = useQuestionContext()
    question = question || currentQuestion

    const classes = useButtonStyle(question)
    const icon = (
        <AlcumusIcon
            icon={
                question.buttonIcon && !Object.isEmpty(question.buttonIcon)
                    ? question.buttonIcon
                    : question.icon
            }
        />
    )
    return useForm ? (
        <mobiscroll.Form className={styles.holderForm}>
            <Component
                disabled={!!disabled}
                fullWidth={question.hints?.full_width}
                variant="outlined"
                className={clsx(classes.button, className)}
                startIcon={
                    !question.hints.caption_below &&
                    (children || question.buttonCaption ? icon : undefined)
                }
                {...props}
            >
                <Box>
                    {question.hints.caption_below && (
                        <Box className={classes.double}>
                            {icon}
                        </Box>
                    )}
                    {children
                        ? children
                        : question.buttonCaption || (!question.hints.caption_below &&  (
                              <span className={classes.double}>{icon}</span>
                          ))}
                </Box>
            </Component>
        </mobiscroll.Form>
    ) : (
        <Component
            disabled={!!disabled}
            fullWidth={question.hints?.full_width}
            variant="outlined"
            className={clsx(classes.button, className)}
            startIcon={
                !question.hints.caption_below &&
                (children || question.buttonCaption ? icon : undefined)
            }
            {...props}

        >
            {' '}
            <Box>
                {question.hints.caption_below && (
                    <Box className={classes.double}>
                        {icon}
                    </Box>
                )}
                {children
                    ? children
                    : question.buttonCaption || (!question.hints.caption_below && (
                    <span className={classes.double}>{icon}</span>
                ))}
            </Box>
        </Component>
    )
}

ConfiguredButton.propTypes = {
    Component: PropTypes.any,
    children: PropTypes.any,
    className: PropTypes.any,
    disabled: PropTypes.any,
    question: PropTypes.any,
    useForm: PropTypes.bool,
}

ConfiguredButton.defaultProps = {
    Component: Button,
    useForm: true,
}
