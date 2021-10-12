import {
    Box, CircularProgress, ButtonGroup, Table, TableBody, TableCell, Paper, TableContainer, TableHead, TableRow, Stack
} from '@mui/material';
import { useModel } from '../Admin';
import { User } from '../User';
import * as React from "react";
import { SRD, RD, notAsked, loading, failure, success } from 'srd'
import { Profile } from '../Profile';

const ProfilesTable = () => {
    const { model, updateModel } = useModel();
    const renderProfiles =
        SRD.match({
            notAsked: () => <p>Let's fetch some data!</p>,
            loading: () =>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />

                </Box>,
            failure: (msg: string) =>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    ,<p>{`I stumbled into this error when I tried to fetch data: ${msg}. Please, reload this page.`}</p>

                </Box>,
            success: (gotUsers: Profile[]) =>

                <Box
                    sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <Stack>
                        <Box sx={{ justifyContent: 'center', display: 'flex' }}>
                            <TableContainer component={Paper}>
                                <Table sx={{ width: '100%' }}>
                                    <TableHead>
                                        <TableRow >
                                            <TableCell>Name</TableCell>
                                            <TableCell>Allowed Sources</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>{gotUsers.map(profile => (<TableRow key={profile.name}>
                                        <TableCell>
                                            {profile.name}
                                        </TableCell>
                                        <TableCell>
                                            {profile.allowedSourceSchemas.join(', ')}
                                        </TableCell>
                                        <TableCell>
                                            <ButtonGroup>


                                            </ButtonGroup>

                                        </TableCell>

                                    </TableRow>))}</TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>

                        </Box>
                    </Stack>

                </Box>


        }, model.profiles)

    return (renderProfiles)
}


export default ProfilesTable