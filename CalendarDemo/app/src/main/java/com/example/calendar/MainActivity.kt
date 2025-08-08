package com.example.calendar

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.calendar.ui.theme.CalendarDemoTheme
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CalendarDemoTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    CalendarScreen()
                }
            }
        }
    }
}

private data class CalendarEvent(
    val id: Long,
    val date: LocalDate,
    val title: String
)

class CalendarViewModel : ViewModel() {
    var currentMonth by mutableStateOf(YearMonth.now())
        private set

    var selectedDate by mutableStateOf(LocalDate.now())
        private set

    // In-memory event store for demo purposes
    private val dateToEvents = mutableStateMapOf<LocalDate, MutableList<CalendarEvent>>()

    fun goToPreviousMonth() {
        currentMonth = currentMonth.minusMonths(1)
        if (selectedDate.year != currentMonth.year || selectedDate.month != currentMonth.month) {
            selectedDate = currentMonth.atDay(1)
        }
    }

    fun goToNextMonth() {
        currentMonth = currentMonth.plusMonths(1)
        if (selectedDate.year != currentMonth.year || selectedDate.month != currentMonth.month) {
            selectedDate = currentMonth.atDay(1)
        }
    }

    fun selectDate(date: LocalDate) {
        selectedDate = date
        currentMonth = YearMonth.from(date)
    }

    fun getEventsFor(date: LocalDate): List<CalendarEvent> =
        dateToEvents[date]?.toList() ?: emptyList()

    fun addEvent(title: String) {
        val event = CalendarEvent(
            id = System.currentTimeMillis(),
            date = selectedDate,
            title = title
        )
        val list = dateToEvents.getOrPut(selectedDate) { mutableListOf() }
        list.add(event)
    }

    fun deleteEvent(event: CalendarEvent) {
        dateToEvents[event.date]?.removeIf { it.id == event.id }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun CalendarScreen(viewModel: CalendarViewModel = viewModel()) {
    var isDialogOpen by remember { mutableStateOf(false) }
    var newEventTitle by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = "Compose 日历 Demo") }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { isDialogOpen = true }) {
                Text("+")
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .padding(16.dp)
                .fillMaxSize()
        ) {
            MonthHeader(
                month = viewModel.currentMonth,
                onPrev = { viewModel.goToPreviousMonth() },
                onNext = { viewModel.goToNextMonth() }
            )
            Spacer(modifier = Modifier.height(12.dp))
            DayOfWeekHeader()
            Spacer(modifier = Modifier.height(8.dp))
            MonthGrid(
                month = viewModel.currentMonth,
                selectedDate = viewModel.selectedDate,
                onSelectDate = { viewModel.selectDate(it) }
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "${viewModel.selectedDate} 的事件",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            val events = viewModel.getEventsFor(viewModel.selectedDate)
            if (events.isEmpty()) {
                Text(text = "暂无事件，点击右下角 + 添加")
            } else {
                EventsList(
                    events = events,
                    onDelete = { viewModel.deleteEvent(it) }
                )
            }
        }

        if (isDialogOpen) {
            AlertDialog(
                onDismissRequest = { isDialogOpen = false },
                title = { Text(text = "添加事件") },
                text = {
                    OutlinedTextField(
                        value = newEventTitle,
                        onValueChange = { newEventTitle = it },
                        label = { Text("标题") }
                    )
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            if (newEventTitle.isNotBlank()) {
                                viewModel.addEvent(newEventTitle.trim())
                                newEventTitle = ""
                                isDialogOpen = false
                            }
                        }
                    ) { Text("添加") }
                },
                dismissButton = {
                    TextButton(onClick = { isDialogOpen = false }) { Text("取消") }
                }
            )
        }
    }
}

@Composable
private fun MonthHeader(month: YearMonth, onPrev: () -> Unit, onNext: () -> Unit) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        TextButton(onClick = onPrev) { Text(text = "< 上个月") }
        Spacer(modifier = Modifier.weight(1f))
        Text(
            text = "${month.year} 年 ${month.month.value} 月",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.weight(1f))
        TextButton(onClick = onNext) { Text(text = "下个月 >") }
    }
}

@Composable
private fun DayOfWeekHeader() {
    val labels = listOf("一", "二", "三", "四", "五", "六", "日")
    Row(modifier = Modifier.fillMaxWidth()) {
        labels.forEach { label ->
            Text(
                text = label,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .weight(1f)
                    .padding(vertical = 4.dp),
                style = MaterialTheme.typography.labelLarge
            )
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun MonthGrid(
    month: YearMonth,
    selectedDate: LocalDate,
    onSelectDate: (LocalDate) -> Unit
) {
    val dates = remember(month) { monthGridDates(month, firstDayOfWeek = DayOfWeek.MONDAY) }
    val today = remember { LocalDate.now() }

    LazyVerticalGrid(
        columns = GridCells.Fixed(7),
        modifier = Modifier
            .fillMaxWidth()
            .height(300.dp),
        userScrollEnabled = false,
        contentPadding = PaddingValues(0.dp)
    ) {
        items(dates) { date ->
            val isInMonth = date.month == month.month
            val isSelected = date == selectedDate
            val isToday = date == today

            val bg = when {
                isSelected -> MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                else -> Color.Transparent
            }
            val textColor = when {
                !isInMonth -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.38f)
                isSelected -> MaterialTheme.colorScheme.primary
                isToday -> MaterialTheme.colorScheme.secondary
                else -> MaterialTheme.colorScheme.onSurface
            }

            Box(
                modifier = Modifier
                    .aspectRatio(1f)
                    .background(bg)
                    .clickable { onSelectDate(date) }
                    .padding(6.dp),
                contentAlignment = Alignment.TopEnd
            ) {
                Text(
                    text = date.dayOfMonth.toString(),
                    color = textColor,
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        }
    }
}

@Composable
private fun EventsList(events: List<CalendarEvent>, onDelete: (CalendarEvent) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        events.forEach { event ->
            ElevatedCard(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = event.title,
                        modifier = Modifier.weight(1f),
                        style = MaterialTheme.typography.bodyLarge
                    )
                    TextButton(onClick = { onDelete(event) }) { Text("删除") }
                }
            }
        }
    }
}

private fun monthGridDates(
    month: YearMonth,
    firstDayOfWeek: DayOfWeek
): List<LocalDate> {
    val firstOfMonth = month.atDay(1)
    val shift = ((firstOfMonth.dayOfWeek.value - firstDayOfWeek.value) + 7) % 7
    val start = firstOfMonth.minusDays(shift.toLong())
    return (0 until 42).map { start.plusDays(it.toLong()) }
}