import { Box, Grid, makeStyles } from '@material-ui/core'
import { mobiscrollStyles } from 'common/mobiscroll-styles'
import { useComponentContext } from 'dynamic/awe-library/runtime/contexts'
import React from 'react'

export const useStyles = makeStyles((theme) => {
    return {
        ...mobiscrollStyles,
        grow: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '0 !important',
        },
        childHolder: {
            overflow: 'hidden',
            '& .mobi-child': {
                paddingRight: theme.spacing(1),
                borderRight: '1px solid #00000010',
            },
            '& .mobi-child:last-child': {
                borderRight: 'none !important',
            },
        },
    }
})

export function MobiscrollLook({ float, label, children, error, ml, mr, pl = 1, pr = 1 }) {
    const classes = useStyles({ mobile: innerWidth < 768, error })
    const { boxPadding, questionPadding } = useComponentContext()

    return (
        <Grid item style={{ marginLeft: -questionPadding * 8 }}>
            <Box
                minHeight={54}
                position={'relative'}
                ml={ml || boxPadding / 2}
                pt={2}
                mr={mr || boxPadding / 2}
                pl={pl}
                pr={pr}
                className={classes.holder}
            >
                {!!label && !float && (
                    <Box pl={1} pb={2} className={classes.inputPlaceholder}>
                        {label}
                    </Box>
                )}
                {!!label && !!float && (
                    <Box pl={1} className={classes.inputLabel}>
                        {label}
                    </Box>
                )}
                <Box
                    display="flex"
                    className={classes.childHolder}
                    flexWrap={'wrap'}
                    mb={-0.5}
                    alignItems={'flex-start'}
                    justifyContent={'flex-start'}
                >
                    {!!children && children}
                </Box>
            </Box>
        </Grid>
    )
}
