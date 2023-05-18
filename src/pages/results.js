import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import keys from '../components/keys'

const Results = () => {
    const [searchParams] = useSearchParams()
    const [data, setData] = useState({'items': []})
    const [user, setUser] = useState({})
    const [list, setList] = useState('short_term')
    const [active, setActive] = useState(0)
    const [show, setShow] = useState(false)
    const [isMenuOpen, setMenuOpen] = useState(false)

    const buttonClick = () => {
        localStorage.clear()
        window.location.replace('/?' + new URLSearchParams({
            log_off: true
        }).toString())
    }

    const refresh = async () => {
        console.log('token refreshed')
        let authOptions = {
            method: 'POST',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: localStorage.getItem('refresh_token'),
                client_id: keys.client_id
            })
        }
        let resp = await fetch('https://accounts.spotify.com/api/token', authOptions)
        if (!resp.ok) {
            buttonClick()
            return null
        }
        let body = await resp.json()
        localStorage.setItem('access_token', body.access_token)
        if ('refresh_token' in body) localStorage.setItem('refresh_token', body.refresh_token)
        return body.access_token
    }

    const handleMenuToggle = () => {
        setMenuOpen(!isMenuOpen)
    }
    
    useEffect(() => {
        const getData = async () => {
            console.log('main run')
            let access_token = localStorage.getItem('access_token')
            if (!access_token) {
                console.log('new token requested')
                let code = searchParams.get('code')
                let state = searchParams.get('state')
                let authOptions = {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        code,
                        redirect_uri: keys.redirect_uri,
                        client_id: keys.client_id,
                        code_verifier: localStorage.getItem('code_verifier')
                    })
                }
                let resp = await fetch('https://accounts.spotify.com/api/token', authOptions)
                let body = await resp.json()
                localStorage.setItem('refresh_token', body.refresh_token)
                access_token = body.access_token
                localStorage.setItem('access_token', access_token)
            }
            let dataPromise = await fetch('https://api.spotify.com/v1/me/top/tracks?' + new URLSearchParams({
                    limit: 50,
                    time_range: list
                }).toString(), {
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    }
                })
            let userProfile = await fetch('https://api.spotify.com/v1/me', {
                headers: {
                    'Authorization': 'Bearer ' + access_token
                }
            })
            if (dataPromise.status === 401) {
                access_token = await refresh()
                dataPromise = await fetch('https://api.spotify.com/v1/me/top/tracks?' + new URLSearchParams({
                    limit: 50,
                    time_range: list
                }).toString(), {
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    }
                })
                userProfile = await fetch('https://api.spotify.com/v1/me', {
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    }
                })
            }
            let dataBody = await dataPromise.json()
            let userBody = await userProfile.json()
            if (userBody.id === 'dgeorgie0407') setShow(true)
            else setShow(false)
            setUser(userBody)
            setData(dataBody)
        }
        getData().catch(() => {
            console.log('err')
        })
    }, [list])

    const queueSong = async uri => {
        let access_token = localStorage.getItem('access_token')
        await fetch('https://api.spotify.com/v1/me/player/queue?' + new URLSearchParams({
            uri
        }).toString(), {
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            method: 'POST'
        })
    }

    // useEffect(() => {
    //     
    //         let dataPromise = await fetch('https://api.spotify.com/v1/me/top/tracks', {
    //             headers: {
    //               'Authorization': 'Bearer ' + body.access_token
    //             }
    //         })
    //         let dataBody = await dataPromise.json()
    //         setData(dataBody)
    //     }
    //     if (!localStorage.getItem('refresh_token')) {
    //         console.log('refresh not run')
    //         return
    //     }
    //     refresh().catch(() => {
    //         console.log('err')
    //     })
    // }, [])
    // console.log(data.items)
    return (
        <div className='App'>
            <nav className="navbar navbar-expand-md navbar-light bg-light fixed-top justify-content-center">
                <button className='navbar-toggler ms-4' type='button' data-toggle='collapse' data-target='#navbarSupportedContent1' onClick={handleMenuToggle}>
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={isMenuOpen ? 'navbar-collapse' : 'navbar-collapse collapse'} id='navbarSupportedContent1'>
                    <ul className='navbar-nav ms-4'>
                        <li className='nav-item'>
                            <button className={active === 0 ? 'btn btn-link link-dark text-decoration-none' : 'btn btn-link link-secondary text-decoration-none'} onClick={() => {setList('short_term'); setActive(0)}}>Last 4 weeks</button>
                        </li>
                        <li className='nav-item'>
                            <button className={active === 1 ? 'btn btn-link link-dark text-decoration-none' : 'btn btn-link link-secondary text-decoration-none'} onClick={() => {setList('medium_term'); setActive(1)}}>Last 6 months</button>
                        </li>
                        <li className='nav-item'>
                            <button className={active === 2 ? 'btn btn-link link-dark text-decoration-none' : 'btn btn-link link-secondary text-decoration-none'} onClick={() => {setList('long_term'); setActive(2)}}>All time</button>
                        </li>
                    </ul>
                </div>
                <div className='text-muted' id='loginfo'>Logged in as {user.display_name}</div>
                <div className="navbar-nav ml-auto">
                    <button id='lastButton' onClick={() => buttonClick()} className="btn btn-outline-primary">Log off</button>
                </div>
            </nav>
            <div id='main'>
                <div>
                    {show ? <p id='message'>Hi Rachel :)</p> : ''}
                </div>
                {data['items'].map((item, idx) => (
                    <div key={idx} className="card border border-primary" id='card'>
                        <div className="card-body">
                            <div className='row'>
                                <div className='col'>
                                    <div id='songTitle'>
                                        <h5><a href={item.external_urls.spotify} className='link-dark' target='_blank' rel='noreferrer'>{item.name}</a></h5>
                                        <button id='queue' onClick={() => queueSong(item.uri)} className='btn btn-outline-primary btn-sm'>Queue song</button>
                                    </div>
                                    <h6 className="card-subtitle mb-2 text-muted">
                                        <a href={item.album.external_urls.spotify} className="link-secondary" target='_blank' rel='noreferrer'>{item.album.name}</a>
                                    <br></br>
                                    Released on {item.album.release_date}</h6>
                                    <h6 className='card-title'>Artists:</h6>
                                    {item.artists.map((artist, artistIdx) => (
                                        <p key={artistIdx} className="pclass"><a href={artist.external_urls.spotify} className="link-secondary" target='_blank' rel='noreferrer'>{artist.name}</a></p>
                                    ))}
                                </div>
                                <div className='col' id='pic'>
                                    <img src={item.album.images[1].url} alt={item.album.name} width={item.album.images[1].width} height={item.album.images[1].height}></img>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Results
