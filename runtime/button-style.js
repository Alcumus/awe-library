/**
 * @module dynamic/awe-library/runtime/button-style
 *
 */
import { makeStyles } from '@material-ui/core'
import { logParams } from 'common/logCall'

/**
 *
 * @function useButtonStyle
 * @description A hook, that passed the definition of a question
 * including a button definition, will return the necessary styles.
 * @param {FieldDefinition} field - a field including a button
 * @returns classes including 'button' which is to be used to
 * style the button
 */

export const useButtonStyle = makeStyles((theme) => {
    return {
        button: {
            lineHeight: 1,
            marginLeft: '0 !important',
            backgroundColor: logParams((props) => `${props.backgroundColor || 'transparent'} !important`, false),
            backgroundImage: logParams((props) => props.backgroundImage && `url(${props.backgroundImage}) !important`),
            backgroundPosition: logParams((props) => props.backgroundPosition),
            width: logParams((props) => props.width),
            height: logParams((props) => props.height),
            backgroundSize: 'cover',
            color: logParams((props) => `${props.color || theme.palette.primary.main} !important`),
            '&:hover': {
                backgroundColor: logParams(
                    (props) => `${props.backgroundColor || `${theme.palette.primary.main}20`} !important`
                ),
            },
        },
        double: {
            fontSize: '200%',
        },
    }
})
