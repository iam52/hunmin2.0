// src/board/BoardListPage.js

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../axios';
import Map from './map/KakaoMap'; // Map 컴포넌트 임포트
import { FaUserCircle } from 'react-icons/fa'; // 프로필 아이콘 임포트
import {
    Box,
    Button,
    Typography,
    List,
    ListItem,
    ListItemText,
    TextField,
    AppBar,
    Toolbar,
    IconButton,
    Container,
    Pagination,
    Grid, // Grid 컴포넌트 임포트
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat'; // 채팅 아이콘 임포트

const BoardListPage = () => {
    const navigate = useNavigate(); // useNavigate 훅 사용
    const memberId = localStorage.getItem('memberId'); // 로컬 스토리지에서 memberId 가져오기
    const nickname = localStorage.getItem('nickname'); // 로컬 스토리지에서 닉네임 가져오기
    const profileImage = localStorage.getItem('image'); // 로컬 스토리지에서 프로필 이미지 가져오기
    const [boards, setBoards] = useState([]);
    const [filteredBoards, setFilteredBoards] = useState([]);
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(5);
    const [totalPages, setTotalPages] = useState(0); // 전체 페이지 수 상태 추가
    const [searchLocation, setSearchLocation] = useState('');
    const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.978 }); // 초기 지도 중심 설정
    const [mapLevel, setMapLevel] = useState(9); // 지도 레벨 상태 추가
    const [showMyBoards, setShowMyBoards] = useState(false); // 내 작성글 보기 상태
    const [kakaoLoaded, setKakaoLoaded] = useState(false); // Kakao Maps SDK 로드 상태

    useEffect(() => {
        if (showMyBoards) {
            fetchMyBoards(); // 내 게시글 목록 가져오기
        } else {
            fetchBoards(); // 전체 게시글 목록 가져오기
        }
    }, [page, size, showMyBoards]);

    useEffect(() => {
        setFilteredBoards(boards);
    }, [boards]);

    useEffect(() => {
        console.log('Kakao API Key:', process.env.REACT_APP_KAKAO_API_KEY); // 추가
        if (!window.kakao) {
            const script = document.createElement('script');
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_API_KEY}&libraries=services,clusterer,drawing`;
            script.async = true;
            script.onload = () => {
                console.log('Kakao Maps SDK loaded.');
                setKakaoLoaded(true);
            };
            script.onerror = () => {
                console.error('Kakao Maps SDK script failed to load.');
            };
            document.head.appendChild(script);
        } else {
            console.log('Kakao Maps SDK already loaded.');
            setKakaoLoaded(true);
        }
    }, []);

    const fetchBoards = async () => {
        try {
            const response = await api.get('/board', {
                params: { page, size },
            });
            setBoards(response.data.content);
            setTotalPages(response.data.totalPages); // 전체 페이지 수 설정
        } catch (error) {
            console.error('Error fetching boards:', error);
        }
    };

    const fetchMyBoards = async () => {
        try {
            const response = await api.get(`/board/member/${memberId}`, {
                params: { page, size },
            });
            setBoards(response.data.content);
            setTotalPages(response.data.totalPages); // 전체 페이지 수 설정
        } catch (error) {
            console.error('Error fetching my boards:', error);
        }
    };

    const handleSearch = async () => {
        if (!kakaoLoaded || !window.kakao.maps) {
            console.error('Kakao Maps SDK is not loaded yet.');
            return;
        }

        const kakao = window.kakao;
        const ps = new kakao.maps.services.Places();

        ps.keywordSearch(searchLocation, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                const firstPlace = data[0];
                const center = { lat: parseFloat(firstPlace.y), lng: parseFloat(firstPlace.x) };

                const nearbyBoards = boards.filter(board => {
                    const distance = getDistance(board.latitude, board.longitude, center.lat, center.lng);
                    return distance <= 5000;
                });

                setFilteredBoards(nearbyBoards);
                setMapCenter(center);
                setMapLevel(5); // 검색 후 지도 확대
            } else {
                setFilteredBoards([]);
                setMapLevel(9); // 초기 레벨로 설정
            }
        });
    };

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    // 프로필 이미지가 유효한지 확인하는 함수
    const isValidProfileImage = (image) => {
        return image && !image.includes('null'); // 이미지가 존재하고 'null'이 포함되지 않은 경우
    };

    // 채팅하기 버튼 클릭 핸들러
    const handleChatClick = () => {
        navigate('/chat-rooms/list'); // 채팅 목록 페이지로 이동
    };

    return (
        <Container>
            {/* AppBar에 프로필과 채팅하기 버튼 추가 */}
            <AppBar position="static">
                <Toolbar style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* 왼쪽: 프로필 이미지 및 닉네임 */}
                    <Box display="flex" alignItems="center">
                        <Link to="/update-member" style={{ textDecoration: 'none', color: 'inherit' }}>
                            {isValidProfileImage(profileImage) ? (
                                <img
                                    src={profileImage}
                                    alt="프로필"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '2px solid #fff', // 이미지에 테두리 추가 (선택적)
                                    }}
                                />
                            ) : (
                                <FaUserCircle size={30} style={{ color: '#fff' }} /> // 프로필 아이콘 표시
                            )}
                        </Link>
                        <Typography variant="h6" style={{ marginLeft: '20px' }}>
                            {nickname} {/* 로컬 스토리지에서 가져온 닉네임 표시 */}
                        </Typography>
                        <Button color="inherit" onClick={() => setShowMyBoards(!showMyBoards)} style={{ marginLeft: '10px' }}>
                            {showMyBoards ? '전체 글 보기' : '내 글 보기'}
                        </Button>
                    </Box>
                    {/* 오른쪽: 채팅하기 버튼 */}
                    <Button color="inherit" startIcon={<ChatIcon />} onClick={handleChatClick}>
                        채팅하기
                    </Button>
                </Toolbar>
            </AppBar>

            <Box mt={2}>
                <Typography variant="h4">{showMyBoards ? '내 글' : '전체 글'}</Typography>
                <Link to="/create-board" style={{ textDecoration: 'none' }}>
                    <Button variant="contained" color="primary">게시글 작성</Button>
                </Link>
            </Box>

            <Grid container spacing={2} mt={2}>
                <Grid item xs={12} md={6}>
                    <List>
                        {filteredBoards.map((board) => (
                            <ListItem key={board.boardId}>
                                <Grid container alignItems="center">
                                    <Grid item xs={10}>
                                        <ListItemText
                                            primary={
                                                <Link to={`/board/${board.boardId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                    <strong>{board.title}</strong> - {board.nickname}
                                                </Link>
                                            }
                                            secondary={
                                                <>
                                                    {board.updatedAt ? (
                                                        <span>수정일: {formatDate(board.updatedAt)}</span>
                                                    ) : (
                                                        <span>작성일: {formatDate(board.createdAt)}</span>
                                                    )}
                                                    {board.location && (
                                                        <span> 장소: {board.location}</span>
                                                    )}
                                                </>
                                            }
                                        />
                                    </Grid>
                                    {board.imageUrls && board.imageUrls.length > 0 ? (
                                        <Grid item xs={2}>
                                            <img
                                                src={board.imageUrls[0]}
                                                alt={board.title}
                                                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                                            />
                                        </Grid>
                                    ) : (
                                        <Grid item xs={2}>
                                            {/* 이미지가 없는 경우 빈 공간으로 유지 */}
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                backgroundColor: '#f0f0f0',
                                                borderRadius: '8px',
                                            }}>
                                            </div>
                                        </Grid>
                                    )}
                                </Grid>
                            </ListItem>
                        ))}
                    </List>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(event, value) => setPage(value)}
                        color="primary"
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        label="위치를 입력하세요"
                        variant="outlined"
                        value={searchLocation}
                        onChange={(e) => setSearchLocation(e.target.value)}
                        fullWidth
                    />
                    <Button variant="contained" color="primary" onClick={handleSearch} style={{ marginTop: '10px' }}>
                        검색
                    </Button>
                    <Map boards={filteredBoards} mapLevel={mapLevel} mapCenter={mapCenter} />
                </Grid>
            </Grid>
        </Container>
    );

};

export default BoardListPage;
