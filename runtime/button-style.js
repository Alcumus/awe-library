import { makeStyles } from '@material-ui/core'
import { logParams } from 'common/logCall'

export const useButtonStyle = makeStyles( ( theme ) => {

    return {
        button: {
            lineHeight: 1,
            marginLeft: '0 !important',
            paddingTop: `${theme.spacing( 2 )}px !important`,
            paddingBottom: `${theme.spacing( 2 )}px !important`,
            backgroundColor: logParams( ( props ) => `${props.backgroundColor || 'transparent'} !important`, false ),
            backgroundImage: logParams( ( props ) => props.backgroundImage && `url(${props.backgroundImage}) !important` ),
            backgroundPosition: logParams( ( props ) => props.backgroundPosition ),
            width: logParams( ( props ) => props.width ),
            height: logParams( ( props ) => props.height ),
            backgroundSize: 'cover',
            color: logParams( ( props ) => `${props.color || theme.palette.primary.main} !important` ),
            '&:hover': {
                backgroundColor: logParams( ( props ) => `${props.backgroundColor || `${theme.palette.primary.main}20`} !important` )
            },
        },
        double: {
            fontSize: '200%'
        }
    }
})
