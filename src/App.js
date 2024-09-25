import { useState, useEffect } from "react";
import { ref, set, push, onValue, remove } from "firebase/database";
import { database, auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Button, TextField, MenuItem, Typography, List, ListItem, ListItemText, Container } from '@mui/material';
import './styles.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(1);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);  // Все пользователи
  const [selectedUser, setSelectedUser] = useState("");  // Выбран пользователь для отзыва
  const [userRole, setUserRole] = useState("user"); // Роль пользователя 
  const [averageRating, setAverageRating] = useState(0); // Сред рейтинг выбаного пользователя

  // Вход через Гуглик
  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then(result => {
        const user = result.user;
        setUser(user);

        const userRef = ref(database, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
          if (!snapshot.exists()) {
            set(userRef, {
              name: user.displayName,
              email: user.email,
              role: "user"
            });
          } else {
            const data = snapshot.val();
            if (data && data.role) {
              setUserRole(data.role); // Об роль пользователя
            }
          }
        });

        toast.success(`Привет, ${user.displayName}`);
      })
      .catch(error => {
        toast.error("Ошибка входа");
        console.error(error);
      });
  };

  // Выход из акка
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        setUserRole("user"); // Сбрас роль при выходе
        toast.success("Вы вышли из аккаунта");
      })
      .catch(error => {
        toast.error("Ошибка выхода");
        console.error(error);
      });
  };

  // Отправка отзыва
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user || !selectedUser) {
      toast.error("Пожалуйста, выберите пользователя и войдите в систему, чтобы оставить отзыв");
      return;
    }

    if (!newReview.trim()) {
      toast.error("Отзыв не может быть пустым");
      return;
    }

    if (rating < 1 || rating > 5) {
      toast.error("Пожалуйста, выберите рейтинг от 1 до 5 звезд");
      return;
    }

    const reviewsRef = ref(database, "reviews");
    const newReviewRef = push(reviewsRef);

    // Сохр отзыв с указанием получателя и отправителя
    set(newReviewRef, { 
      fromUser: user.uid, 
      fromUserName: user.displayName, // Имя отправителя
      toUser: selectedUser, 
      toUserName: users.find(u => u.uid === selectedUser).name, // Имя выбр пользователя
      text: newReview, 
      rating 
    })
    .then(() => {
      toast.success("Отзыв успешно отправлен!");
    })
    .catch((error) => {
      toast.error("Ошибка при отправке отзыва");
      console.error("Ошибка при отправке отзыва: ", error);
    });

    setNewReview("");
    setRating(1);
  };

  // Загрузка пользователей (только если пользователь авторизован)
  useEffect(() => {
    if (user) {
      const usersRef = ref(database, "users");
      onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        const usersArray = data ? Object.keys(data).map(id => ({ uid: id, ...data[id] })) : [];
        setUsers(usersArray);
      });
    }
  }, [user]);

  // Загрузка отзывов и вычисление сред рейтинга для выбранного польз
  useEffect(() => {
    if (selectedUser) {
      const reviewsRef = ref(database, "reviews");
      onValue(reviewsRef, (snapshot) => {
        const data = snapshot.val();
        const reviewsArray = data ? Object.keys(data).map(id => ({ id, ...data[id] })) : [];
        setReviews(reviewsArray);

        // Фильтр отзывы только для выбр пользов
        const userReviews = reviewsArray.filter(review => review.toUser === selectedUser);

        // Вычисление сред рейтинга
        const totalRating = userReviews.reduce((acc, review) => acc + review.rating, 0);
        const avgRating = userReviews.length > 0 ? (totalRating / userReviews.length).toFixed(1) : 0;
        setAverageRating(avgRating);
      });
    }
  }, [selectedUser]);

  // Удаление отзыва (доступно только для меня и админа)
  const handleDelete = (reviewId) => {
    if (userRole !== "admin") {
      toast.error("Только администраторы могут удалять отзывы");
      return;
    }

    const reviewRef = ref(database, `reviews/${reviewId}`);
    remove(reviewRef)
      .then(() => {
        toast.success("Отзыв удален!");
      })
      .catch((error) => {
        toast.error("Ошибка при удалении отзыва");
        console.error("Ошибка при удалении отзыва: ", error);
      });
  };

  return (
    <Container className="container">
      <Typography variant="h4" gutterBottom>Отзывы</Typography>
      {user ? (
        <div>
          <p>Привет, {user.displayName}</p>
          <Button variant="contained" color="secondary" onClick={handleLogout}>Выйти</Button>
          <form onSubmit={handleSubmit}>
            <TextField
              select
              label="Выберите пользователя"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              fullWidth
              margin="normal"
            >
              {users.map((u) => (
                <MenuItem key={u.uid} value={u.uid}>
                  {u.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Оставьте отзыв"
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Рейтинг"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              fullWidth
              margin="normal"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <MenuItem key={star} value={star}>
                  {star} Star{star > 1 ? "s" : ""}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" color="primary" type="submit">Отправить</Button>
          </form>
          <Typography variant="h6" gutterBottom>Средний рейтинг: {averageRating}</Typography>
          <List>
            {reviews
              .filter(review => review.toUser === selectedUser) // Отображаем только отзывы о выбранном пользователе
              .map((review) => (
              <ListItem key={review.id} className="list-item">
                <ListItemText
                  primary={<span className="review-text">{review.fromUserName} о {review.toUserName}: {review.text}</span>}
                  secondary={<span className="review-rating">{review.rating} Star{review.rating > 1 ? "s" : ""}</span>}
                />
                {user && userRole === "admin" && (
                  <Button color="secondary" onClick={() => handleDelete(review.id)}>Удалить</Button>
                )}
              </ListItem>
            ))}
          </List>
        </div>
      ) : (
        <Button variant="contained" color="primary" onClick={handleLogin}>Войти с помощью Google</Button>
      )}
      <ToastContainer />
    </Container>
  );
}

export default App;
