// eslint-disable-next-line no-unused-vars
import { Box } from '@material-ui/core'
import React from 'react'
import { useComponentContext } from 'dynamic/awe-library/runtime/contexts'
import PropTypes from 'prop-types'

export function InputBox({ children, errorMessage, valid = true, ...props }) {
    const { questionSpacing } = useComponentContext()
    return (
        <Box mb={questionSpacing * (valid ? 1 : 2)} {...props}>
            {children}
        </Box>
    )
}

InputBox.propTypes = {
    children: PropTypes.any,
    errorMessage: PropTypes.any,
    valid: PropTypes.bool
}

InputBox.defaultProps = {
    valid: true
}
