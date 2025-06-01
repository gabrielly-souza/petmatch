.\venv\Scripts\activate

// app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "8063a830296b5dc210babc3399e32e2b")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "b3fb61ecd8eaa84d224acd18a81b604995649841a9a8a52812ce690148105f35")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

'postgresql://postgres:2802@localhost:5433/pet_match_db'